type Key = string | number | symbol
type Typed = {
	type: Key
}

// TODO: test with exemple from xState
// TODO: parallel states

function isFinal<State extends Typed>(
	state: State,
): state is State & { type: 'final' } {
	return state.type === 'final'
}

export type ChildState<K extends Key, State extends Typed> = {
	type: K
	state: State
}

export type ChildMachine<
	K extends Key,
	Event extends Typed,
	State extends Typed,
	Param,
> = Machine<Event, { type: K; state: State }, Param>

class Machine<Event extends Typed, State extends Typed, Param> {
	init: (param: Param) => State
	transitions: Partial<
		Record<Event['type'], (event: Event, state: State) => State | undefined>
	>
	constructor({ init }: { init: (param: Param) => State }) {
		this.init = init
		this.transitions = {}
	}
	send(event: Event, state: State) {
		return (
			this.transitions[event.type as Event['type']]?.(event, state) ?? state
		)
	}
	send_(event: Event, state: State) {
		return this.transitions[event.type as Event['type']]?.(event, state)
	}
	// last added transition has precedence
	// transition is responsible for checking the state type
	addTransition<E extends Event, ET extends E['type']>(
		eventType: ET,
		transition: (e: E, s: State) => State | undefined,
	) {
		const t = this.transitions[eventType]
		this.transitions[eventType] = t
			? (e: Event, s: State) => transition(e as E, s) ?? t(e, s)
			: (transition as (e: Event, s: State) => State | undefined)
	}
	addChildTransition<
		E extends Event,
		K extends E['type'],
		ST extends State['type'],
	>(eventType: K, transition: (e: E, s: State) => State | undefined, key: ST) {
		this.addTransition(eventType, (e, s) => {
			if (s.type !== key) return undefined
			return transition(e as E, s)
		})
	}

	child<K extends Key>(key: K) {
		const send = this.send_
		return function <ParentState extends State>(
			onDone?: (state: State & { type: 'final' }) => ParentState | undefined,
		) {
			return function (event: Event, { state }: ChildState<K, State>) {
				const res = send(event, state)
				if (res === undefined) return undefined
				if (onDone && isFinal(res)) return onDone(res)
				return { child: key, state }
			}
		}
	}
	toChild<K extends Key>(key: K, param: Param) {
		return { child: key, state: this.init(param) }
	}
}

type Transitions<Events extends Typed, States extends Typed> = {
	[StateType in Exclude<States['type'], 'final'>]: Partial<{
		[EventType in Events['type']]: <
			Event extends Events & { type: EventType },
			State extends States & { type: StateType },
		>(
			event: Event,
			state: State,
		) => States | undefined
	}>
}

export function machine<
	State extends Typed,
	Event extends Typed,
	Param = void,
>({
	init,
	states,
}: {
	init: (param: Param) => State
	states: Transitions<Event, State>
}) {
	const m = new Machine<Event, State, Param>({
		init: init,
	})
	// PERF: could index on state type
	for (const entry of Object.entries(states)) {
		const [stateType, stateTransitions] = entry as [
			Event['type'],
			Partial<
				Record<Event['type'], (event: Event, state: State) => State | undefined>
			>,
		]
		for (const entry_ of Object.entries(stateTransitions)) {
			const [eventType, cb] = entry_ as [
				Event['type'],
				(event: Event, state: State) => State | undefined,
			]
			m.addTransition(eventType, (e, s) =>
				s.type === stateType ? cb(e, s) : undefined,
			)
		}
	}
	return m
}
