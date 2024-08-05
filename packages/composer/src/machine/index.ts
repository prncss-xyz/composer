/* eslint-disable @typescript-eslint/no-explicit-any */
import { objForearch } from '@/utils'

type Typed = {
	type: string
}

export function machine<
	Event extends Typed,
	State extends Typed,
	Context,
	Param = void,
>(o: MachineSpec<Event, State, Context, Param>) {
	function withContext(s: State) {
		return { state: s, context: o.states[s.type as State['type']].context(s) }
	}
	const machine = new Machine<Event, { state: State; context: Context }, Param>(
		(p: Param) => withContext(o.init(p)),
		({ state }) => state.type === 'final',
	)
	objForearch(o.states, (stateType, desc) => {
		if (stateType === 'final') return
		const { events } = desc
		objForearch(events, (eventType, transition) => {
			machine.addTransition(
				eventType,
				(event, { state, context }) => {
					if (state.type !== stateType) return undefined
					const nextSourceState = transition!(event as any, state, context)
					if (nextSourceState === undefined) return undefined
					return withContext(nextSourceState)
				},
				false,
			)
		})
	})
	return machine
}

export class Machine<Event extends Typed, State, Param = void> {
	init: (param: Param) => State
	isFinal: (state: State) => boolean
	transitions: Map<
		Event['type'],
		(event: Event, state: State) => State | undefined
	> = new Map()
	constructor(
		init: (param: Param) => State,
		isFinal: (state: State) => boolean,
	) {
		this.init = init
		this.isFinal = isFinal
	}
	send<K extends string = ''>(
		event: Event | ({ type: K } extends Event ? K : never),
		state: State,
	) {
		event =
			typeof event === 'string' ? ({ type: event } as unknown as Event) : event
		return this._send(event, state) ?? state
	}
	_send(event: Event, state: State) {
		return this.transitions.get(event.type as Event['type'])?.(event, state)
	}
	// last added transition has precedence
	// transition is responsible for checking the state type
	addTransition(
		eventType: Event['type'],
		transition: (e: Event, s: State) => State | undefined,
		inclusive: boolean,
	) {
		const t = this.transitions.get(eventType)
		this.transitions.set(
			eventType,
			t
				? (e: Event, s: State) =>
						inclusive
							? t(e, transition(e, s) ?? s)
							: (transition(e, s) ?? t(e, s))
				: transition,
		)
	}
	addSubtransition<Substate>(
		eventType: Event['type'],
		transition: (e: Event, s: Substate) => Substate | undefined,
		{
			getter,
			setter,
		}: {
			getter: (s: State) => Substate | undefined
			setter: (v: Substate, s: State) => State
		},
		inclusive: boolean,
	) {
		const t: (e: Event, s: State) => State | undefined = (e, s) => {
			const t = getter(s)
			if (t === undefined) return undefined
			const u = transition(e, t)
			if (u === undefined) return undefined
			return setter(u, s)
		}
		this.addTransition(eventType, t, inclusive)
	}
}

type Final = 'reject' | 'resolve'

export type MachineSpec<
	Event extends Typed,
	State extends Typed,
	Context,
	Param,
> = {
	init: (param: Param) => State
	states: {
		[StateType in Exclude<State['type'], Final>]: {
			events: Partial<{
				[EventType in Event['type']]: <
					E extends Event & { type: EventType },
					S extends State & { type: StateType },
				>(
					event: E,
					state: S,
					context: Context,
				) => State | undefined
			}>
		}
	} & {
		[StateType in State['type']]: {
			context: <S extends State & { type: StateType }>(state: S) => Context
		}
	}
}
