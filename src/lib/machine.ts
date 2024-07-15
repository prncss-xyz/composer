type Typed = {
	type: string | number | symbol
}

export const FINAL = Symbol('FINAL')

type Transitions<Events extends Typed, States extends Typed> = {
	[StateType in Exclude<States['type'], typeof FINAL>]: Partial<{
		[EventType in Events['type']]: <
			Event extends Events & { type: EventType },
			State extends States & { type: StateType },
		>(
			event: Event,
			state: State,
		) => States | undefined
	}>
}

function compile<Event extends Typed, State extends Typed>(
	transitions: Transitions<Event, State>,
) {
	return function (event: Event, state: State) {
		return (
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(transitions as any)[state.type][event.type]?.(event, state) as
				| State
				| undefined
		)
	}
}

class Machine<Event extends Typed, State extends Typed> {
	private readonly transitions: (
		event: Event,
		state: State,
	) => State | undefined
	constructor(transitions: (event: Event, state: State) => State | undefined) {
		this.transitions = transitions
	}
	send(event: Event, state: State) {
		return this.transitions(event, state)
	}
}

export function machine<State extends Typed, Event extends Typed>({
	states,
}: {
	states: Transitions<Event, State>
}) {
	return new Machine<Event, State>(compile(states))
}
