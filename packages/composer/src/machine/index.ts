/* eslint-disable @typescript-eslint/no-explicit-any */
import { objForearch } from '@/utils'

type Typed = {
	type: PropertyKey
}

type G = Record<PropertyKey, (...props: never[]) => unknown>

export function machine<
	Event extends Typed,
	State extends Typed,
	Param = void,
	Getters extends G = Record<never, never>,
>(o: MachineSpec<Param, Event, State, Getters>) {
	const machine = new Machine<Event, State, Param, Getters>(
		o.init,
		(key, state) => (o.states as any)[state.type].getters[key](state),
		({ type }) => type === 'final',
	)
	objForearch(o.states, (stateType, { on }) => {
		objForearch(on, (eventType, transition) => {
			machine.addTransition(eventType, (event, state) => {
				if (state.type !== stateType) return undefined
				const nextSourceState = transition!(event as any, state as any)
				if (nextSourceState === undefined) return undefined
				return nextSourceState
			})
		})
	})
	return machine
}

export class Machine<
	Event extends Typed,
	State extends Typed,
	Param = void,
	Getters extends G = Record<never, never>,
> {
	init: (param: Param) => State
	_getters: <Key extends keyof Getters>(key: Key, state: State) => Getters[Key]
	isFinal: (state: State) => boolean
	transitions: Map<
		Event['type'],
		(event: Event, state: State) => State | undefined
	> = new Map()
	constructor(
		init: (param: Param) => State,
		_getters: <Key extends keyof Getters>(
			key: Key,
			state: State,
		) => Getters[Key],
		isFinal: (state: State) => boolean,
	) {
		this.init = init
		this._getters = _getters
		this.isFinal = isFinal
	}
	getter<Key extends keyof Getters>(key: Key): (state: State) => Getters[Key] {
		return (state: State) => this._getters(key, state)
	}
	send(event: Event, state: State) {
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
	) {
		const t = this.transitions.get(eventType)
		this.transitions.set(
			eventType,
			t ? (e: Event, s: State) => transition(e, s) ?? t(e, s) : transition,
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
	) {
		const t: (e: Event, s: State) => State | undefined = (e, s) => {
			const t = getter(s)
			if (t === undefined) return undefined
			const u = transition(e, t)
			if (u === undefined) return undefined
			return setter(u, s)
		}
		this.addTransition(eventType, t)
	}
}

export type MachineSpec<
	Param,
	Events extends Typed,
	States extends Typed,
	Getters extends Record<PropertyKey, (...props: never[]) => unknown>,
> = {
	init: (param: Param) => States
	states: {
		[StateType in Exclude<States['type'], 'final'>]: {
			on: Partial<{
				[EventType in Events['type']]: <
					Event extends Events & { type: EventType },
					State extends States & { type: StateType },
				>(
					event: Event,
					state: State,
				) => States | undefined
			}>
			getters: {
				[K in keyof Getters]: (s: States & { type: StateType }) => Getters[K]
			}
		}
	}
}
