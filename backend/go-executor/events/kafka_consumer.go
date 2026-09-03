package events

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/segmentio/kafka-go"
)

type EventHandler interface {
	Handle(event PaymentFailedEvent) error
}

type KafkaConsumer struct {
	reader  *kafka.Reader
	handler EventHandler
}

func NewKafkaConsumer(
	reader *kafka.Reader,
	handler EventHandler,
) *KafkaConsumer {
	return &KafkaConsumer{
		reader:  reader,
		handler: handler,
	}
}

func (c *KafkaConsumer) Consume(ctx context.Context) error {
	message, err := c.reader.FetchMessage(ctx)
	if err != nil {
		return fmt.Errorf("fetch kafka message: %w", err)
	}

	var event PaymentFailedEvent

	if err := json.Unmarshal(message.Value, &event); err != nil {
		return fmt.Errorf("decode payment failed event: %w", err)
	}

	if err := ValidatePaymentFailedEvent(event); err != nil {
		return fmt.Errorf("invalid payment failed event: %w", err)
	}

	if err := c.handler.Handle(event); err != nil {
		return fmt.Errorf("handle payment failed event: %w", err)
	}

	if err := c.reader.CommitMessages(ctx, message); err != nil {
		return fmt.Errorf("commit kafka message: %w", err)
	}

	return nil
}
