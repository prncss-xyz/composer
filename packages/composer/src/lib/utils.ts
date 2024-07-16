import { isFunction } from './guards'
import { eqWithReset } from './optics/core'
import { Store } from './stores'

export function id<T>(t: T) {
	return t
}

export type Init<T> = T | (() => T)

export function initToVal<T>(init: Init<T>): T {
	return isFunction(init) ? init() : init
}

export function initToCb<T>(init: Init<T>): () => T {
	return isFunction(init) ? init : () => init
}

export function storeToOptic<V>(store: Store<V>) {
	return eqWithReset(() => store.initial())
}
