package events

type ExecutionResult struct {
	PaymentID string
	Recovered bool
	Attempts  int
	Outcome   string
	Amount    float64
}
