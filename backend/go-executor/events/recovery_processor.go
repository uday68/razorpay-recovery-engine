package events

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
) (DecisionResult, error) {
	return p.decisioner.Decide(event)
}
