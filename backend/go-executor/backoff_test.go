// Now we need to address a real distributed-systems problem.

// Imagine 100,000 payments fail because a bank/gateway temporarily times out.

// If we immediately retry all of them:

// 10:00:00  Gateway outage
//            ↓
// 100k failures
//            ↓
// 100k immediate retries
//            ↓
// Gateway gets hammered
//            ↓
// More failures
//            ↓
// More retries
//            ↓
// 🔥 retry storm

// Instead:

// Failure
//   ↓
// Retry decision
//   ↓
// Backoff
//   ↓
// Jitter
//   ↓
// Retry

// A typical exponential backoff:
// =================================================================
// $$ delay = base \times 2^{attempt-1} $$

// Then jitter prevents synchronized retries:

// $$ delay_{actual}=delay+\text{random jitter} $$
//================================================================================================
// For this project we'll keep it simple and test the policy without actually sleeping.

package main

import (
	"testing"
	"time"
)

func TestBackoffIncreasesWithAttempt(t *testing.T) {
	backoff := NewBackoffPolicy(100)

	first := backoff.Delay(1)
	second := backoff.Delay(2)
	third := backoff.Delay(3)

	if second <= first {
		t.Fatalf("expected second delay > first delay")
	}

	if third <= second {
		t.Fatalf("expected third delay > second delay")
	}
}

func TestBackoffFirstAttemptUsesBaseDelay(t *testing.T) {
	backoff := NewBackoffPolicy(100)

	delay := backoff.Delay(1)

	if delay < 100 {
		t.Fatalf("expected delay >= 100ms, got %v", delay)
	}
}

func TestBackoffJitterStayWithinBounds(t *testing.T) {
	backoff := NewBackoffPolicy(100)
	for i := 0; i < 100; i++ {
		delay := backoff.DelayWithJitter(2)

		min := 200 * time.Millisecond
		max := 300 * time.Millisecond
		if delay < min || delay > max {
			t.Fatalf("expected delay between %v  and %v,got %v", min, max, delay)
		}
	}
}

func TestBackoffJitterProducesVariation(t *testing.T) {
	backoff := NewBackoffPolicy(100)

	first := backoff.DelayWithJitter(2)
	different := false

	for i := 0; i < 20; i++ {
		if backoff.DelayWithJitter(2) != first {
			different = true
			break
		}
	}
	if !different {
		t.Fatal("expected jitter to produce varaying delays")
	}
}
