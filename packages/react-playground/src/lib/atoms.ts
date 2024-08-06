import { AtomStore, Store } from '../../../composer/dist/stores'
import { id, Init, Reducer, Updater } from '../../../composer/dist/utils'
import { useSetStore, useStoreValue } from './stores'

export function createAtom<T>(init: Init<T>, reducer: Reducer<T, T> = id) {
	return new AtomStore<T>(init, reducer)
}

export function useAtom<T>(
	store: Store<T, T>,
): readonly [T, (value: Updater<T>) => void]
export function useAtom<T>(
	store: Store<T, T>,
	value: Updater<T>,
): readonly [T, () => void]
export function useAtom<T>(store: Store<T, T>, value?: undefined | Updater<T>) {
	return [useStoreValue(store, id), useSetStore(store, value)] as const
}
