package events

type RecoveryFlowResult struct {
	Command   RecoveryCommand
	Execution ExecutionResult
}

type RecoveryFlow struct {
	eventStore EventStoreClaimer
	decisioner RecoveryDecisioner
	executor   CommandExecutor
}

type EventStoreClaimer interface {
	Claim(eventID string) (bool, error)
}

func NewRecoveryFlow(
	eventStore EventStoreClaimer,
	decisioner RecoveryDecisioner,
	executor CommandExecutor,
) *RecoveryFlow {
	return &RecoveryFlow{
		eventStore: eventStore,
		decisioner: decisioner,
		executor:   executor,
	}
}

func (f *RecoveryFlow) Process(
	event PaymentFailedEvent,
) (RecoveryFlowResult, error) {
	claimed, err := f.eventStore.Claim(event.EventID)
	if err != nil {
		return RecoveryFlowResult{}, err
	}

	if !claimed {
		return RecoveryFlowResult{}, nil
	}

	processor := NewDecisionRecoveryProcessor(f.decisioner)

	command, err := processor.Process(event)
	if err != nil {
		return RecoveryFlowResult{}, err
	}

	executionWorker := NewRecoveryExecutionWorker(f.executor)

	execution, err := executionWorker.Execute(command)
	if err != nil {
		return RecoveryFlowResult{}, err
	}

	return RecoveryFlowResult{
		Command:   command,
		Execution: execution,
	}, nil
}
