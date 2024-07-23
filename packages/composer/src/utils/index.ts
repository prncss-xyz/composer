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

export function fromInit<T>(init: Init<T>): T {
	return isFunction(init) ? init() : init
}

export function storeToOptic<V>(store: Store<V>) {
	return eqWithReset(() => store.initial())
}

export type XF = <Value, Acc>() => {
	init: Acc
	fold: (v: Value, acc: Acc) => Acc
}

export interface Monoid<Value, Acc> {
	init: Init<Acc>
	fold: (v: Value, acc: Acc) => Acc
}

export function first<V>(): Monoid<V, V | undefined> {
	return {
		init: undefined,
		fold: (v, acc) => acc ?? v,
	}
}

export function last<V>(): Monoid<V, V | undefined> {
	return {
		init: undefined,
		fold: id,
	}
}

export function collect<V>(): Monoid<V, V[]> {
	return {
		init: () => [],
		fold: (v, acc) => {
			acc.push(v)
			return acc
		},
	}
}

export interface Monoid2<Value, Acc, Ix> {
	init: Init<Acc>
	fold: (v: Value, acc: Acc, ix: Ix) => Acc
}

export function head2<V>(): Monoid2<V, V | undefined, unknown> {
	return {
		init: undefined,
		fold: id,
	}
}

export function collect2<V>(): Monoid2<V, V[], number> {
	return {
		init: () => [],
		fold: (v, acc, ix) => {
			acc[ix] = v
			return acc
		},
	}
}
