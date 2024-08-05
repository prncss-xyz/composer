/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useRef, useSyncExternalStore } from 'react'

import { Machine } from '../../composer/dist/machine'
import { ReducerStore } from '../../composer/dist/stores'
import { isFunction } from '../../composer/dist/utils'

// TODO: string message

type Typed = {
	type: string
}

export function createMachine<
	Param,
	Events extends Typed,
	States extends Typed,
	Getters extends Record<PropertyKey, (...props: never[]) => unknown>,
>(machine: Machine<Events, States, Param, Getters>, param: Param) {
	const reducer = machine.send.bind(machine)
	const init = machine.init.bind(machine)
	return new ReducerStore<Events, States, Param>(reducer, param, init)
}

export function machineHooks<Param, Events extends Typed, States>(
	store: ReducerStore<Events, States, Param>,
) {
	return {
		get: <U>(
			select: (t: States) => U,
			areEqual: (a: U, b: U) => boolean = Object.is,
		) => useReducerSelect(store, select, areEqual),
		send: (event: Events | (() => Events)) => useReducerSend(store, event),
	}
}

export function useSyncSelect<Snapshot, Select>(
	select: (v: Snapshot) => Select,
	areEqual: (a: Select, b: Select) => boolean,
	subscribe: (onStoreChange: () => void) => () => void,
	getSnapshot: () => Snapshot,
	getServerSnapshot?: () => Snapshot,
): Select {
	const acc = useRef(select(getSnapshot()))
	return useSyncExternalStore(
		(nofity) =>
			subscribe(() => {
				const next = select(getSnapshot())
				if (!areEqual(acc.current, next)) {
					acc.current = next
					nofity()
				}
			}),
		() => acc.current,
		getServerSnapshot ? () => select(getServerSnapshot()) : undefined,
	)
}

export function useReducerSelect<T, Acc, Param, U>(
	store: ReducerStore<T, Acc, Param>,
	select: (t: Acc) => U,
	areEqual: (a: U, b: U) => boolean = Object.is,
) {
	return useSyncSelect(
		select,
		areEqual,
		store.subscribe.bind(store),
		store.peek.bind(store),
		store.peek.bind(store),
	)
}

export function useReducerSend<T, Acc, Param>(
	store: ReducerStore<T, Acc, Param>,
	event: T | (() => T),
) {
	return useCallback(() => {
		store.put(isFunction(event) ? event() : event)
	}, [event, store])
}

export function useMachineFinal() {
	// TODO:
}

export const useMachine = {
	send: useReducerSend,
	get: useReducerSelect,
}


