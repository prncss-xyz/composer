import { eqWithReset } from '../optics/core'
import { Store } from '../stores'

export * from './flow'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction<T>(x: T): x is T & ((...args: any[]) => any) {
	return typeof x === 'function'
}

export function id<T>(t: T) {
	return t
}

export type Init<T> = T | (() => T)

export function initToVal<T>(init: Init<T>): T {
	return isFunction(init) ? init() : init
}

export function storeToOptic<V>(store: Store<V>) {
	return eqWithReset(() => store.initial())
}
