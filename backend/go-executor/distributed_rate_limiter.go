package main

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Lua script for atomic sliding/fixed window token bucket
const rateLimitLua = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
    redis.call('EXPIRE', key, window)
end

local ttl = redis.call('TTL', key)
if current > limit then
    return {0, current, ttl}
else
    return {1, current, ttl}
end
`

type RateLimitResult struct {
	Allowed         bool          `json:"allowed"`
	CurrentTokens   int64         `json:"current_tokens"`
	Limit           int64         `json:"limit"`
	RemainingTokens int64         `json:"remaining_tokens"`
	TTL             time.Duration `json:"ttl"`
	Status          string        `json:"status"` // "LIVE" or "UNAVAILABLE"
	Key             string        `json:"key"`
}

type DistributedRateLimiter struct {
	client     *redis.Client
	script     *redis.Script
	failClosed bool
}

func NewDistributedRateLimiter(redisAddr string, password string, db int, failClosed bool) *DistributedRateLimiter {
	rdb := redis.NewClient(&redis.Options{
		Addr:         redisAddr,
		Password:     password,
		DB:           db,
		DialTimeout:  1 * time.Second,
		ReadTimeout:  1 * time.Second,
		WriteTimeout: 1 * time.Second,
	})

	return &DistributedRateLimiter{
		client:     rdb,
		script:     redis.NewScript(rateLimitLua),
		failClosed: failClosed,
	}
}

func (d *DistributedRateLimiter) Allow(ctx context.Context, key string, limit int64, windowSeconds int) (*RateLimitResult, error) {
	redisKey := fmt.Sprintf("recovery:ratelimit:%s", key)

	res, err := d.script.Run(ctx, d.client, []string{redisKey}, limit, windowSeconds).Result()
	if err != nil {
		if d.failClosed {
			// Fail-closed for payment safety: reject payment attempt if limiter infrastructure fails
			return &RateLimitResult{
				Allowed:         false,
				CurrentTokens:   limit + 1,
				Limit:           limit,
				RemainingTokens: 0,
				TTL:             0,
				Status:          "UNAVAILABLE",
				Key:             redisKey,
			}, fmt.Errorf("rate limiter redis unavailable (fail-closed): %w", err)
		}
		// Fail-open (if configured)
		return &RateLimitResult{
			Allowed:         true,
			CurrentTokens:   0,
			Limit:           limit,
			RemainingTokens: limit,
			TTL:             0,
			Status:          "UNAVAILABLE",
			Key:             redisKey,
		}, nil
	}

	vals, ok := res.([]interface{})
	if !ok || len(vals) < 3 {
		return nil, fmt.Errorf("unexpected redis rate limit response: %v", res)
	}

	allowedCode, _ := vals[0].(int64)
	current, _ := vals[1].(int64)
	ttlSec, _ := vals[2].(int64)

	allowed := (allowedCode == 1)
	remaining := limit - current
	if remaining < 0 {
		remaining = 0
	}

	return &RateLimitResult{
		Allowed:         allowed,
		CurrentTokens:   current,
		Limit:           limit,
		RemainingTokens: remaining,
		TTL:             time.Duration(ttlSec) * time.Second,
		Status:          "LIVE",
		Key:             redisKey,
	}, nil
}

func (d *DistributedRateLimiter) Close() error {
	return d.client.Close()
}
