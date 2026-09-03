package events

type EventPublisher interface {
	Publish(event PaymentFailedEvent) error
}

type MemoryPublisher struct {
	events []PaymentFailedEvent
}

func NewMemoryPublisher() *MemoryPublisher {
	return &MemoryPublisher{
		events: make([]PaymentFailedEvent, 0),
	}
}

func (p *MemoryPublisher) Publish(event PaymentFailedEvent) error {
	p.events = append(p.events, event)
	return nil
}

func (p *MemoryPublisher) Count() int {
	return len(p.events)
}

func (p *MemoryPublisher) Events() []PaymentFailedEvent {
	return p.events
}
