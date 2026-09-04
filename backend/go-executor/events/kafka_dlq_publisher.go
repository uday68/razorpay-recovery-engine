package events

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
)

// DeadLetterEnvelope defines the complete provenance and failure envelope for dead-lettered events
type DeadLetterEnvelope struct {
	DLQID                 string `json:"dlq_id"`
	OriginalTopic         string `json:"original_topic"`
	OriginalPartition     int    `json:"original_partition"`
	OriginalOffset        int64  `json:"original_offset"`
	ConsumerGroup         string `json:"consumer_group"`
	EventID               string `json:"event_id"`
	PaymentID             string `json:"payment_id"`
	FailureReason         string `json:"failure_reason"`
	FailureCategory       string `json:"failure_category"`
	AttemptCount          int    `json:"attempt_count"`
	FirstFailureTimestamp string `json:"first_failure_timestamp"`
	DeadLetterTimestamp   string `json:"dead_letter_timestamp"`
	RawPayload            string `json:"raw_payload"`
}

type DLQPublisher interface {
	PublishDLQ(ctx context.Context, envelope DeadLetterEnvelope) error
}

type KafkaDLQPublisher struct {
	writer *kafka.Writer
}

func NewKafkaDLQPublisher(brokers []string, topic string) *KafkaDLQPublisher {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(brokers...),
		Topic:        topic,
		Balancer:     &kafka.LeastBytes{},
		RequiredAcks: kafka.RequireAll, // acks=all for strict delivery guarantee
		Async:        false,
	}

	return &KafkaDLQPublisher{
		writer: writer,
	}
}

func (p *KafkaDLQPublisher) PublishDLQ(ctx context.Context, envelope DeadLetterEnvelope) error {
	payload, err := json.Marshal(envelope)
	if err != nil {
		return fmt.Errorf("marshal dead letter envelope: %w", err)
	}

	key := envelope.PaymentID
	if key == "" {
		key = envelope.EventID
	}
	if key == "" {
		key = envelope.DLQID
	}

	err = p.writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(key),
		Value: payload,
		Time:  time.Now(),
	})
	if err != nil {
		return fmt.Errorf("publish to kafka dlq topic (%s): %w", p.writer.Topic, err)
	}

	return nil
}

func (p *KafkaDLQPublisher) Close() error {
	return p.writer.Close()
}

// InMemoryDLQPublisher provides mock/test DLQ storage with thread-safe introspection
type InMemoryDLQPublisher struct {
	mu       sync.Mutex
	Messages []DeadLetterEnvelope
	FailNext bool
}

func NewInMemoryDLQPublisher() *InMemoryDLQPublisher {
	return &InMemoryDLQPublisher{
		Messages: make([]DeadLetterEnvelope, 0),
	}
}

func (m *InMemoryDLQPublisher) PublishDLQ(ctx context.Context, envelope DeadLetterEnvelope) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.FailNext {
		return fmt.Errorf("simulated dlq broker network failure")
	}

	m.Messages = append(m.Messages, envelope)
	return nil
}

func (m *InMemoryDLQPublisher) Count() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.Messages)
}
