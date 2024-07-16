import { id, Init, initToVal } from '../utils'

interface StoreConstructor<T> {
	init: Init<T>
	wantsSSR: boolean
	intercept: (next: T, prev: T) => T
}

export class Store<T> {
	private init: Init<T>
	protected acc: T
	private subscribers: Set<(t: T) => void> = new Set()
	private wantsSSR: boolean
	private intercept: (next: T, prev: T) => T
	constructor({ init, wantsSSR = true, intercept = id }: StoreConstructor<T>) {
		this.init = init
		this.wantsSSR = wantsSSR
		this.intercept = intercept
		this.acc = initToVal(init)
	}
	initial() {
		return initToVal(this.init)
	}
	put(v: T) {
		const next = this.intercept(v, this.acc)
		this.acc = next
		for (const subscriber of this.subscribers) {
			subscriber(next)
		}
	}
	modify(f: (t: T) => T) {
		this.put(f(this.acc))
	}
	view() {
		return this.acc
	}
	subscribe(subscriber: (t: T) => void) {
		this.subscribers.add(subscriber)
		return () => {
			this.subscribers.delete(subscriber)
		}
	}
	ssr() {
		return this.wantsSSR ? () => initToVal(this.init) : undefined
	}
}

export function selectedStore<T, U>(
	store: Store<T>,
	select: (t: T) => U,
	areEqual = Object.is,
) {
	return {
		subscribe: (subscriber: (t: U) => void) => {
			let last = select(store.view())
			return store.subscribe((u) => {
				if (areEqual(last, select(u))) return
				last = select(u)
				subscriber(select(u))
			})
		},
		view: () => select(store.view()),
		ssr: () => {
			const r = store.ssr()
			return r ? select(r()) : undefined
		},
	}
}
