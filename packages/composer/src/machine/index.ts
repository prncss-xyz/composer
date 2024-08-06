/* eslint-disable @typescript-eslint/no-explicit-any */
import { isNever, objForearch } from '@/utils'

type Typed = {
	type: string
}

// when event is just { type: string }, we can use string as shorthand
export type Sendable<T extends Typed> =
	| T
	| (T extends { type: infer U } ? ({ type: U } extends T ? U : never) : never)

export class Machine<
	Event extends Typed,
	State,
	Param = void,
	Final extends State = never,
> {
	init: (param: Param) => State
	isFinal: (state: State) => state is Final
	transitions: Map<
		Event['type'],
		(event: Event, state: State) => State | undefined
	> = new Map()
	constructor(
		init: (param: Param) => State,
		isFinal: (state: State) => state is Final,
	) {
		this.init = init
		this.isFinal = isFinal
	}
	send(event: Sendable<Event>, state: State) {
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

type MachineSpec<Event extends Typed, State extends Typed, Context, Param> = {
	init: (param: Param) => State
	states: {
		[StateType in Exclude<State['type'], 'final'>]: {
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
		[StateType in State['type']]: Context extends Record<string, unknown>
			? {
					context: <S extends State & { type: StateType }>(state: S) => Context
				}
			:
					| {
							context: <S extends State & { type: StateType }>(
								state: S,
							) => Context
					  }
					| Record<never, never>
	}
}

type ComposedFinal<State extends Typed, Context> = State & {
	type: 'final'
} extends never
	? never
	: { state: State & { type: 'final' }; context: Context }

export function machine<
	Event extends Typed,
	State extends Typed,
	Context,
	Param = void,
>(o: MachineSpec<Event, State, Context, Param>) {
	function isFinal(v: {
		state: State
		context: Context
	}): v is ComposedFinal<State, Context> {
		return v.state.type === 'final'
	}
	function withContext(s: State) {
		const c = o.states[s.type as State['type']]
		const context = 'context' in c ? c.context(s) : ({} as Context)
		return { state: s, context }
	}
	const machine = new Machine<
		Event,
		{ state: State; context: Context },
		Param,
		ComposedFinal<State, Context>
	>((p: Param) => withContext(o.init(p)), isFinal)
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

type SingleState<Event extends Typed, State, Context, Param> = {
	init: (param: Param) => State
	events: {
		[EventType in Event['type']]: <E extends Event & { type: EventType }>(
			event: E,
			state: State,
			context: Context,
		) => State | undefined
	}
} & (Context extends Record<string, unknown>
	? { context: (state: State) => Context }
	: { context: (state: State) => Context } | Record<never, never>)

export function simpleMachine<Event extends Typed, State, Context, Param>(
	o: SingleState<Event, State, Context, Param>,
) {
	function withContext(s: State) {
		return {
			state: s,
			context: 'context' in o ? o.context(s) : ({} as Context),
		}
	}
	const machine = new Machine<Event, { state: State; context: Context }, Param>(
		(p: Param) => withContext(o.init(p)),
		isNever,
	)
	objForearch(o.events, (eventType, transition) => {
		machine.addTransition(
			eventType,
			(event, { state, context }) => {
				const nextSourceState = transition!(event as any, state, context)
				if (nextSourceState === undefined) return undefined
				return withContext(nextSourceState)
			},
			false,
		)
	})
	return machine
}
