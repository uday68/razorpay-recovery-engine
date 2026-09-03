package main

import (
	"testing"
	"time"
)

func TestPostgresCommandStorePersistsIdempotency(t *testing.T) {
	databaseURL := "postgres://recovery:recovery@localhost:5432/recovery_engine?sslmode=disable"

	store, err := NewPostgresCommandStore(databaseURL)
	if err != nil {
		t.Skipf("PostgreSQL not available: %v", err)
	}
	defer store.Close()

	commandID := "postgres-persistence-" + time.Now().Format("20060102150405.000000000")

	first, err := store.Claim(commandID)
	if err != nil {
		t.Fatalf("first claim failed: %v", err)
	}

	if !first {
		t.Fatal("first claim should succeed")
	}

	second, err := store.Claim(commandID)
	if err != nil {
		t.Fatalf("second claim failed: %v", err)
	}

	if second {
		t.Fatal("second claim should be rejected as duplicate")
	}

	if err := store.Delete(commandID); err != nil {
		t.Fatalf("failed to clean up command: %v", err)
	}
}
