package main

import (
	"testing"

	"github.com/segmentio/kafka-go"
)

func TestBuildRecoveryConsumer(t *testing.T) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{"localhost:9092"},
		Topic:   "recovery.payment.failed",
		GroupID: "recovery-worker-test",
	})

	defer reader.Close()

	consumer := buildRecoveryConsumer(
		reader,
		"postgres://recovery:recovery@localhost:5432/recovery_engine?sslmode=disable",
		"http://localhost:8000",
		"http://localhost:8080",
	)

	if consumer == nil {
		t.Fatal("expected recovery consumer to be created")
	}
}
