package main

import (
	"fmt"
	"sync"
	"time"
)

type RateLimiter struct {
	mu          sync.Mutex
	rate        int
	interval    time.Duration
	nextAllowed time.Time
}

func NewRateLimiter(ratePerSecond int) *RateLimiter {
	if ratePerSecond <= 0 {
		panic(fmt.Sprintf(
			"ratePerSecond must be greater than zero, got %d",
			ratePerSecond,
		))
	}

	return &RateLimiter{
		rate:        ratePerSecond,
		interval:    time.Second / time.Duration(ratePerSecond),
		nextAllowed: time.Now(),
	}
}

func (r *RateLimiter) Wait() error {
	r.mu.Lock()

	now := time.Now()

	if now.After(r.nextAllowed) {
		r.nextAllowed = now
	}

	wait := time.Until(r.nextAllowed)
	r.nextAllowed = r.nextAllowed.Add(r.interval)

	r.mu.Unlock()

	if wait > 0 {
		time.Sleep(wait)
	}

	return nil
}
