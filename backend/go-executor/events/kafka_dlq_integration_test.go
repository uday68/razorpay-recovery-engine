package events

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/segmentio/kafka-go"
)

type StubKafkaMessageReader struct {
	messages []kafka.Message
	index    int
	commits  []kafka.Message
}

func (r *StubKafkaMessageReader) FetchMessage(ctx context.Context) (kafka.Message, error) {
	if r.index >= len(r.messages) {
		return kafka.Message{}, fmt.Errorf("no more messages")
	}
	msg := r.messages[r.index]
	r.index++
	return msg, nil
}

func (r *StubKafkaMessageReader) CommitMessages(ctx context.Context, msgs ...kafka.Message) error {
	r.commits = append(r.commits, msgs...)
	return nil
}

type StubFailingHandler struct {
	shouldFail bool
	callCount  int
}

func (h *StubFailingHandler) Handle(event PaymentFailedEvent) error {
	h.callCount++
	if h.shouldFail {
		return fmt.Errorf("simulated payment gateway timeout")
	}
	return nil
}

func TestRobustKafkaConsumer_PoisonPillRoutesToDLQAndCommits(t *testing.T) {
	dlq := NewInMemoryDLQPublisher()
	handler := &StubFailingHandler{shouldFail: false}

	reader := &StubKafkaMessageReader{
		messages: []kafka.Message{
			{
				Topic:     "recovery.payment.failed",
				Partition: 0,
				Offset:    101,
				Key:       []byte("bad-key"),
				Value:     []byte("{this is definitely not valid json}"),
			},
		},
	}

	consumer := NewRobustKafkaConsumer(
		reader,
		handler,
		dlq,
		3,
		"test-group",
	)

	err := consumer.ConsumeOnce(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if dlq.Count() != 1 {
		t.Fatalf("expected 1 DLQ message, got %d", dlq.Count())
	}
	dlqMsg := dlq.Messages[0]
	if dlqMsg.FailureCategory != "MALFORMED_JSON" {
		t.Fatalf("expected MALFORMED_JSON, got %s", dlqMsg.FailureCategory)
	}
	if dlqMsg.OriginalOffset != 101 {
		t.Fatalf("expected offset 101, got %d", dlqMsg.OriginalOffset)
	}
	if len(reader.commits) != 1 {
		t.Fatalf("expected original offset to be committed after DLQ success")
	}
}

func TestRobustKafkaConsumer_MaxRetriesExhaustedRoutesToDLQ(t *testing.T) {
	dlq := NewInMemoryDLQPublisher()
	handler := &StubFailingHandler{shouldFail: true}

	validEvent := PaymentFailedEvent{
		EventID:       "evt_fail_1",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay_fail_1",
		CustomerID:    "cust_1",
		Amount:        1500.0,
		PaymentMethod: "CARD",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
		Timestamp:     time.Now(),
	}
	payload, _ := json.Marshal(validEvent)

	reader := &StubKafkaMessageReader{
		messages: []kafka.Message{
			{
				Topic:     "recovery.payment.failed",
				Partition: 1,
				Offset:    205,
				Key:       []byte(validEvent.EventID),
				Value:     payload,
			},
		},
	}

	consumer := NewRobustKafkaConsumer(
		reader,
		handler,
		dlq,
		3,
		"recovery-workers",
	)

	err := consumer.ConsumeOnce(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if handler.callCount != 3 {
		t.Fatalf("expected exactly 3 attempts, got %d", handler.callCount)
	}
	if dlq.Count() != 1 {
		t.Fatalf("expected 1 dead letter item, got %d", dlq.Count())
	}
	item := dlq.Messages[0]
	if item.PaymentID != "pay_fail_1" {
		t.Fatalf("expected payment ID pay_fail_1, got %s", item.PaymentID)
	}
	if item.AttemptCount != 3 {
		t.Fatalf("expected attempt count 3, got %d", item.AttemptCount)
	}
	if len(reader.commits) != 1 {
		t.Fatalf("expected original message committed after DLQ write")
	}
}

func TestRobustKafkaConsumer_DLQFailurePreventsMessageCommit(t *testing.T) {
	dlq := NewInMemoryDLQPublisher()
	dlq.FailNext = true

	reader := &StubKafkaMessageReader{
		messages: []kafka.Message{
			{
				Topic:     "recovery.payment.failed",
				Partition: 0,
				Offset:    300,
				Value:     []byte("bad json"),
			},
		},
	}

	consumer := NewRobustKafkaConsumer(
		reader,
		&StubFailingHandler{},
		dlq,
		1,
		"test",
	)

	err := consumer.ConsumeOnce(context.Background())

	if err == nil {
		t.Fatalf("expected error when DLQ write fails")
	}
	if dlq.Count() != 0 {
		t.Fatalf("expected 0 messages in DLQ, got %d", dlq.Count())
	}
	if len(reader.commits) != 0 {
		t.Fatalf("expected 0 commits when DLQ write fails (message must not be committed)")
	}
}
