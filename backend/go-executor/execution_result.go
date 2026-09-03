package main

type ExecutionResult struct {
	FinalResult GatewayResult
	Attempts    int
	Outcome     string
	Retryable   bool
	Recovered   bool
}
