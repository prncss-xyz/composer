/* eslint-disable @typescript-eslint/no-explicit-any */
import { id, objForearch } from '@/utils'

import { Machine, MachineSpec } from '.'

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

function isLeft(o: { type: PropertyKey }): o is { type: 'left' } {
	return o.type === 'left'
}

export function sumMachine<
	Event extends Typed,
	LState extends Typed,
	RState extends Typed,
	LParam = void,
	RParam = void,
	RGetters extends G = Record<never, never>,
	LGetters extends G = Record<never, never>,
	Param = void,
>(
	left: Machine<Event, LState, LParam, LGetters>,
	right: Machine<Event, RState, RParam, RGetters>,
	init: (p: Param) => SumState<LState, RState>,
	exit: (s: SumState<LState, RState>) => SumState<LState, RState> = id,
) {
	const machine = new Machine<
		Event,
		SumState<LState, RState>,
		Param,
		SumGetters<LGetters, RGetters>
	>(
		init,
		(key, state) => {
			return isLeft(state)
				? (left._getters as any)[key](state.state)
				: (right._getters as any)[key](state.state)
		},
		(state) =>
			isLeft(state) ? left.isFinal(state.state) : right.isFinal(state.state),
	)

	left.transitions.forEach((transition, eventType) => {
		machine.addSubtransition(eventType, transition, {
			getter: ({ type, state }) => (type === 'left' ? state : undefined),
			setter: (state) =>
				left.isFinal(state)
					? exit({ type: 'left', state })
					: { type: 'left', state },
		})
	})
	right.transitions.forEach((transition, eventType) => {
		machine.addSubtransition(eventType, transition, {
			getter: ({ type, state }) => (type === 'right' ? state : undefined),
			setter: (state) =>
				right.isFinal(state)
					? exit({ type: 'right', state })
					: { type: 'right', state },
		})
	})
	return machine
}

type SumState<L, R> = { type: 'left'; state: L } | { type: 'right'; state: R }
type SumGetter<L, R> = L extends (...props: infer AP) => infer AR
	? R extends (...props: infer AQ) => infer QR
		? (...props: AP & AQ) => AR | QR
		: never
	: never
type SumGetters<L extends G, R extends G> = {
	[K in keyof L & keyof R]: SumGetter<L[K], R[K]>
}
