package events

import "fmt"

type RecoveryDecisioner interface {
	Decide(event PaymentFailedEvent) (DecisionResult, error)
}

type DecisionRecoveryProcessor struct {
	decisioner RecoveryDecisioner
}

func NewDecisionRecoveryProcessor(
	decisioner RecoveryDecisioner,
) *DecisionRecoveryProcessor {
	return &DecisionRecoveryProcessor{
		decisioner: decisioner,
	}
}

func (p *DecisionRecoveryProcessor) Process(
	event PaymentFailedEvent,
) (RecoveryCommand, error) {

	result, err := p.decisioner.Decide(event)
	if err != nil {
		return RecoveryCommand{}, err
	}

	if result.PaymentID != event.PaymentID {
		return RecoveryCommand{}, fmt.Errorf(
			"decision payment_id %s does not match event payment_id %s",
			result.PaymentID,
			event.PaymentID,
		)
	}

	return RecoveryCommand{
		CommandID: event.EventID + "-command",
		PaymentID: event.PaymentID,
		Action:    result.Action,
		Amount:    event.Amount,
	}, nil
}
