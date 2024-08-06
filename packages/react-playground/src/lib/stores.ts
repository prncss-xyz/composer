import { useMemo, useRef, useSyncExternalStore } from 'react'

import { Store } from '../../../composer/dist/stores'
import {
	AreEqual,
	Init,
	isFunction,
	Updater,
} from '../../../composer/dist/utils'

function useSyncSelect<Snapshot, Selected>(
	select: (v: Snapshot) => Selected,
	areEqual: (a: Selected, b: Selected) => unknown,
	subscribe: (onStoreChange: () => void) => () => void,
	getSnapshot: () => Snapshot,
	getServerSnapshot?: () => Snapshot,
): Selected {
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

export function useStoreValue<Event, Acc, Selected>(
	store: Store<Event, Acc>,
	select: (t: Acc) => Selected,
	areEqual: AreEqual<Selected> = Object.is,
) {
	return useSyncSelect(
		select,
		areEqual,
		store.subscribe.bind(store),
		store.peek.bind(store),
		store.peek.bind(store),
	)
}

export function useSetStore<T>(
	store: Store<T, T>,
	value?: undefined,
): (value: Updater<T>) => void
export function useSetStore<T>(
	store: Store<T, T>,
	value: Updater<T>,
): () => void
// this is needed to make useAtom
export function useSetStore<T>(
	store: Store<T, T>,
	value?: undefined | Updater<T>,
): ((value: Updater<T>) => void) | (() => void)
export function useSetStore<Event, Acc>(
	store: Store<Event, Acc>,
	value?: undefined,
): (value: Init<Event>) => void
export function useSetStore<Event, Acc>(
	store: Store<Event, Acc>,
	value: Init<Event>,
): () => void
export function useSetStore<Event, Acc>(
	store: Store<Event, Acc>,
	value?: undefined | Event | ((acc: Acc) => Acc),
) {
	return useMemo(
		() =>
			value === undefined
				? () => {
						return (value: Event | ((acc: Acc) => Acc)) => {
							isFunction(value)
								? store.put(value(store.peek()))
								: store.put(value)
						}
					}
				: () => {
						isFunction(value)
							? store.put(value(store.peek()))
							: store.put(value)
					},
		[store, value],
	)
}
