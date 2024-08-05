/* eslint-disable @typescript-eslint/no-explicit-any */

import { Machine } from '.'

type Typed = {
	type: string
}

type G = Record<PropertyKey, (...props: never[]) => unknown>

export function historyMachine<
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
	init: (p: Param) => HistoryState<LState, RState>,
	reset?: (s: HistoryState<LState, RState>) => HistoryState<LState, RState>,
) {
	const isFinal = (state: HistoryState<LState, RState>) =>
		state.type === 'left'
			? left.isFinal(state.left)
			: right.isFinal(state.right)
	const machine = new Machine<
		Event,
		HistoryState<LState, RState>,
		Param,
		HistoryGetters<LGetters, RGetters>
	>(
		init,
		(key, state) => {
			return state.type === 'left'
				? (left._getters as any)(key, state.left)
				: (right._getters as any)(key, state.right)
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
					return s?.left
				},
				setter: (left, state) => ({ ...state, left, type: 'left' }),
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
					return s?.right
				},
				setter: (right, state) => ({ ...state, right, type: 'right' }),
			},
			false,
		)
	})
	return machine
}

type HistoryState<L, R> = { left: L; right: R; type: 'left' | 'right' }
type HistoryGetter<L, R> = L extends (...props: infer AP) => infer AR
	? R extends (...props: infer AQ) => infer QR
		? (...props: AP & AQ) => AR | QR
		: never
	: never
type HistoryGetters<L extends G, R extends G> = {
	[K in keyof L & keyof R]: HistoryGetter<L[K], R[K]>
}
