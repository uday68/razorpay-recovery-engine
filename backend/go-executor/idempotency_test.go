package main

import (
	"testing"
)

func TestCommandStoreClaimsOnlyOnce(t *testing.T) {
	store := NewCommandStore()

	first, err := store.Claim("cmd-001")
	second, err := store.Claim("cmd-001")

	if err != nil {
		t.Fatalf("first claim failed :%v", err)
	}

	if err != nil {
		t.Fatalf("second claim failed :%v", err)
	}
	if !first {
		t.Fatal("first claim should succeed")
	}

	if second {
		t.Fatal("second claim should fail")
	}

}
func TestPostgresCommandStoreClaimsOnlyOnce(t *testing.T) {
	store, err := NewPostgresCommandStore(
		"postgres://recovery:recovery@localhost:5432/recovery_engine?sslmode=disable",
	)

	if err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	commandID := "postgres-test-001"

	// Clean up from previous runs.
	err = store.Delete(commandID)
	if err != nil {
		t.Fatalf("failed to clean test command: %v", err)
	}

	first, err := store.Claim(commandID)
	if err != nil {
		t.Fatalf("first claim failed: %v", err)
	}

	second, err := store.Claim(commandID)
	if err != nil {
		t.Fatalf("second claim failed: %v", err)
	}

	if !first {
		t.Fatal("first claim should succeed")
	}

	if second {
		t.Fatal("second claim should fail")
	}

	err = store.Delete(commandID)
	if err != nil {
		t.Fatalf("failed to clean up: %v", err)
	}
}
