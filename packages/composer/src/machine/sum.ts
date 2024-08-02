/* eslint-disable @typescript-eslint/no-explicit-any */
import { id } from '@/utils'

import { Machine } from '.'

type Typed = {
	type: string
}

type G = Record<PropertyKey, (...props: never[]) => unknown>

function isLeft(o: { type: PropertyKey }): o is { type: 'left' } {
	return o.type === 'left'
}

export function sumMachine<
	Event extends Typed,
	LState,
	RState,
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
				? (left._getters as any)(key, state.state)
				: (right._getters as any)(key, state.state)
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
