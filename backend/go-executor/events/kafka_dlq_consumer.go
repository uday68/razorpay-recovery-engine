package events

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
)

type KafkaMessageReader interface {
	FetchMessage(ctx context.Context) (kafka.Message, error)
	CommitMessages(ctx context.Context, msgs ...kafka.Message) error
}

type RobustKafkaConsumer struct {
	reader        KafkaMessageReader
	handler       EventHandler
	dlqPublisher  DLQPublisher
	maxRetries    int
	consumerGroup string
}

func NewRobustKafkaConsumer(
	reader KafkaMessageReader,
	handler EventHandler,
	dlqPublisher DLQPublisher,
	maxRetries int,
	consumerGroup string,
) *RobustKafkaConsumer {
	if maxRetries <= 0 {
		maxRetries = 3
	}
	if consumerGroup == "" {
		consumerGroup = "recovery-worker-group"
	}

	return &RobustKafkaConsumer{
		reader:        reader,
		handler:       handler,
		dlqPublisher:  dlqPublisher,
		maxRetries:    maxRetries,
		consumerGroup: consumerGroup,
	}
}

func (c *RobustKafkaConsumer) ConsumeOnce(ctx context.Context) error {
	message, err := c.reader.FetchMessage(ctx)
	if err != nil {
		return fmt.Errorf("fetch kafka message: %w", err)
	}

	rawPayload := string(message.Value)
	firstFailureTime := time.Now().UTC().Format(time.RFC3339)

	var event PaymentFailedEvent
	if err := json.Unmarshal(message.Value, &event); err != nil {
		// Poison pill: Malformed JSON payload
		return c.handleFatalError(ctx, message, rawPayload, "MALFORMED_JSON", err.Error(), 1, firstFailureTime)
	}

	if err := ValidatePaymentFailedEvent(event); err != nil {
		// Poison pill: Schema validation failure
		return c.handleFatalError(ctx, message, rawPayload, "SCHEMA_VALIDATION_ERROR", err.Error(), 1, firstFailureTime)
	}

	// Bounded retry loop for transient handler failures
	var lastErr error
	for attempt := 1; attempt <= c.maxRetries; attempt++ {
		lastErr = c.handler.Handle(event)
		if lastErr == nil {
			// Processing succeeded, commit original message
			if c.reader != nil {
				if err := c.reader.CommitMessages(ctx, message); err != nil {
					return fmt.Errorf("commit kafka message: %w", err)
				}
			}
			return nil
		}
	}

	// Max retries exhausted: Route to DLQ
	return c.handleFatalError(
		ctx,
		message,
		rawPayload,
		"MAX_RETRIES_EXHAUSTED",
		fmt.Sprintf("Handler failed after %d attempts: %v", c.maxRetries, lastErr),
		c.maxRetries,
		firstFailureTime,
	)
}

func (c *RobustKafkaConsumer) handleFatalError(
	ctx context.Context,
	msg kafka.Message,
	rawPayload string,
	category string,
	reason string,
	attempts int,
	firstFailTime string,
) error {
	var event PaymentFailedEvent
	_ = json.Unmarshal([]byte(rawPayload), &event)

	envelope := DeadLetterEnvelope{
		DLQID:                 fmt.Sprintf("dlq-%d-%d", msg.Partition, msg.Offset),
		OriginalTopic:         msg.Topic,
		OriginalPartition:     msg.Partition,
		OriginalOffset:        msg.Offset,
		ConsumerGroup:         c.consumerGroup,
		EventID:               event.EventID,
		PaymentID:             event.PaymentID,
		FailureReason:         reason,
		FailureCategory:       category,
		AttemptCount:          attempts,
		FirstFailureTimestamp: firstFailTime,
		DeadLetterTimestamp:   time.Now().UTC().Format(time.RFC3339),
		RawPayload:            rawPayload,
	}

	// 1. Publish to DLQ
	if c.dlqPublisher != nil {
		if err := c.dlqPublisher.PublishDLQ(ctx, envelope); err != nil {
			// CRITICAL: If DLQ publish fails, DO NOT commit original offset!
			return fmt.Errorf("failed to publish to dlq (offset NOT committed): %w", err)
		}
	}

	// 2. Commit original message offset ONLY after DLQ publish is acknowledged
	if c.reader != nil {
		if err := c.reader.CommitMessages(ctx, msg); err != nil {
			return fmt.Errorf("committed dlq message but commit original offset failed: %w", err)
		}
	}

	return nil
}
