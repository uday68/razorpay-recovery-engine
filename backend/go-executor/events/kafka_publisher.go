package events

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/segmentio/kafka-go"
)

type KafkaPublisher struct {
	writer *kafka.Writer
}

func NewKafkaPublisher(writer *kafka.Writer) *KafkaPublisher {
	return &KafkaPublisher{
		writer: writer,
	}
}

func (p *KafkaPublisher) Publish(event PaymentFailedEvent) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal payment failed event:%w", err)

	}
	err = p.writer.WriteMessages(context.Background(), kafka.Message{
		Key:   []byte(event.EventID),
		Value: payload,
	})

	if err != nil {
		return fmt.Errorf("publish payment failed event:%w", err)
	}

	return nil
}
