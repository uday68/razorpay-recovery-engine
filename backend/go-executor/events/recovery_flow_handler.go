package events

type RecoveryFlowHandler struct {
	flow *RecoveryFlow
}

func NewRecoveryFlowHandler(flow *RecoveryFlow) *RecoveryFlowHandler {
	return &RecoveryFlowHandler{
		flow: flow,
	}
}

func (h *RecoveryFlowHandler) Handle(
	event PaymentFailedEvent,
) error {
	_, err := h.flow.Process(event)
	return err
}
