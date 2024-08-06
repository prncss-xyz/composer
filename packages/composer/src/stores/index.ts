import { fromInit, id, Init, isFunction } from '../utils'

type Reducer<T, Acc> = (t: T, acc: Acc) => Acc | undefined

export class Subcribable<Acc, T> {
	protected acc: Acc
	private reducer: Reducer<T, Acc>
	// TODO: WeakSet
	private subscribers: Set<(t: Acc) => void> = new Set()
	constructor(init: Acc, reducer: Reducer<T, Acc>) {
		this.acc = init
		this.reducer = reducer
	}
	put(v: T) {
		const next = this.reducer(v, this.acc)
		if (next === undefined || next === this.acc) return
		this.acc = next
		this.notify()
	}
	peek() {
		return this.acc
	}
	subscribe(subscriber: (t: Acc) => void) {
		this.subscribers.add(subscriber)
		return () => {
			this.subscribers.delete(subscriber)
		}
	}
	notify() {
		for (const subscriber of this.subscribers) {
			subscriber(this.acc)
		}
	}
}

export class ReducerStore<
	T,
	Acc,
	Param,
	Final extends Acc = never,
> extends Subcribable<Acc, T> {
	public isFinal: (acc: Acc) => acc is Final
	constructor(
		reducer: Reducer<T, Acc>,
		initalArg: Param,
		init: (p: Param) => Acc,
		isFinal: (acc: Acc) => acc is Final,
	) {
		super(init(initalArg), reducer)
		this.isFinal = isFinal
	}
}

export class StateStore<T> extends Subcribable<T, T> {
	constructor(init: Init<T>, reducer: Reducer<T, T> = id) {
		super(fromInit(init), reducer)
	}
	modify(f: (t: T) => T) {
		this.put(f(this.acc))
	}
	update(t: T | ((t: T) => T)) {
		if (isFunction(t)) this.put(t(this.acc))
		else this.put(t)
	}
}
