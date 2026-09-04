package main

import (
	"testing"
	"time"
)

func TestRateLimitsExecutionRate(t *testing.T) {
	limiter := NewRateLimiter(2)
	start := time.Now()

	for i := 0; i < 4; i++ {
		if err := limiter.Wait(); err != nil {
			t.Fatalf("rate limiter wait failed :%v", err)

		}
	}

	elapsed := time.Since(start)
	if elapsed < 900*time.Millisecond {
		t.Fatalf("expected rate limiter to take at least ~1 second,took %v", elapsed)
	}
}
