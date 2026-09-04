package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/segmentio/kafka-go"

	"recovery-executor/events"
)

const (
	defaultKafkaURL = "localhost:9092"
	defaultTopic    = "recovery.payment.failed"
	defaultGroup    = "recovery-worker"
	defaultDBURL    = "postgres://recovery:recovery@localhost:5432/recovery_engine?sslmode=disable"
	defaultAIURL    = "http://localhost:8000"
	defaultExecURL  = "http://localhost:8080"
)

func envOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}

	return fallback
}

func buildRecoveryConsumer(
	reader *kafka.Reader,
	databaseURL string,
	aiURL string,
	executorURL string,
) *events.KafkaConsumer {
	eventStore, err := events.NewPostgresEventStore(databaseURL)
	if err != nil {
		panic(err)
	}

	decisionClient := events.NewDecisionClient(aiURL)
	executionClient := events.NewExecutionClient(executorURL)

	return events.NewRecoveryKafkaConsumer(
		reader,
		eventStore,
		decisionClient,
		executionClient,
	)
}

func main() {
	kafkaURL := envOrDefault("KAFKA_URL", defaultKafkaURL)
	topic := envOrDefault("KAFKA_TOPIC", defaultTopic)
	group := envOrDefault("KAFKA_GROUP", defaultGroup)
	databaseURL := envOrDefault("DATABASE_URL", defaultDBURL)
	aiURL := envOrDefault("AI_URL", defaultAIURL)
	executorURL := envOrDefault("EXECUTOR_URL", defaultExecURL)

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{kafkaURL},
		Topic:   topic,
		GroupID: group,
	})

	defer reader.Close()

	consumer := buildRecoveryConsumer(
		reader,
		databaseURL,
		aiURL,
		executorURL,
	)

	log.Printf(
		"recovery worker listening: kafka=%s topic=%s group=%s ai=%s executor=%s",
		kafkaURL,
		topic,
		group,
		aiURL,
		executorURL,
	)

	ctx, stop := signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer stop()

	for {
		if err := consumer.Consume(ctx); err != nil {
			if ctx.Err() != nil {
				log.Println("recovery worker shutting down")
				return
			}

			log.Printf("recovery worker error: %v", err)
		}
	}
}
