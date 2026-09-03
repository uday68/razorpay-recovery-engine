package main

import "fmt"

func validateRecoveryCommand(command RecoveryCommand) error {
	if command.CommandID == "" {
		return fmt.Errorf("command_id is required")
	}
	if command.PaymentID == "" {
		return fmt.Errorf("payment_id is required")
	}
	switch command.Action {
	case "RETRY_NOW", "RETRY_LATER", "SEND_REMINDER", "NO_ACTION":
	default:
		return fmt.Errorf("invalid action :%s", command.Action)
	}
	if command.Amount <= 0 {
		return fmt.Errorf("amount must be greater than zero")
	}
	return nil
}
