/* eslint-disable @typescript-eslint/no-explicit-any */
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
	reset?: (s: SumState<LState, RState>) => SumState<LState, RState>,
) {
	const isFinal = (state: SumState<LState, RState>) =>
		isLeft(state) ? left.isFinal(state.state) : right.isFinal(state.state)
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
		(state) => {
			if (isFinal(state)) {
				if (reset) return isFinal(reset(state))
				return true
			}
			return false
		},
	)
	left.transitions.forEach((transition, eventType) => {
		machine.addSubtransition(
			eventType,
			transition,
			{
				getter: (s) => {
					if (reset && machine.isFinal(s)) s = reset(s)
					if (s.type == 'left') return s.state
					return undefined
				},
				setter: (state) => ({ type: 'left', state }),
			},
			false,
		)
	})
	right.transitions.forEach((transition, eventType) => {
		machine.addSubtransition(
			eventType,
			transition,
			{
				getter: (s) => {
					if (reset && machine.isFinal(s)) s = reset(s)
					if (s.type == 'right') return s.state
					return undefined
				},
				setter: (state) => ({ type: 'right', state }),
			},
			false,
		)
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
