package events

type RecoveryCommand struct {
	CommandID string  `json:"command_id"`
	PaymentID string  `json:"payment_id"`
	Action    string  `json:"action"`
	Amount    float64 `json:"amount"`
}
