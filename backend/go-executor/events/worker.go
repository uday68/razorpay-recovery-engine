package events

type RecoveryProcessor interface {
	Process(event PaymentFailedEvent) error
}

type RecoveryWorker struct {
	processor RecoveryProcessor
}

func NewRecoveryWorker(processor RecoveryProcessor) *RecoveryWorker {
	return &RecoveryWorker{
		processor: processor,
	}
}

func (w *RecoveryWorker) Process(event PaymentFailedEvent) error {
	if err := ValidatePaymentFailedEvent(event); err != nil {
		return err
	}

	return w.processor.Process(event)
}
