package main

import (
	"math/rand"
	"time"
)

type BackoffPolicy struct {
	baseDelay time.Duration
}

func NewBackoffPolicy(baseDelayMs int) *BackoffPolicy {
	return &BackoffPolicy{
		baseDelay: time.Duration(baseDelayMs) * time.Millisecond,
	}
}

func (b *BackoffPolicy) Delay(attempt int) time.Duration {
	if attempt < 1 {
		attempt = 1
	}

	return b.baseDelay * time.Duration(1<<(attempt-1))
}

func (b *BackoffPolicy) DelayWithJitter(attempt int) time.Duration {
	delay := b.Delay(attempt)

	jitter := time.Duration(rand.Int63n(int64(delay / 2))) //

	return delay + jitter
}
