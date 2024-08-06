import { fromInit, id, Init, isFunction, Reducer } from '../utils'

export class Store<Event, Acc> {
	protected acc: Acc
	private reducer: Reducer<Event, Acc>
	// TODO: WeakSet
	private subscribers: Set<(t: Acc) => void> = new Set()
	constructor(init: Acc, reducer: Reducer<Event, Acc>) {
		this.acc = init
		this.reducer = reducer
	}
	put(v: Event) {
		const next = this.reducer(v, this.acc)
		if (Object.is(next, this.acc)) return
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

export class MachineStore<
	Event,
	Acc,
	Param,
	Final extends Acc = never,
> extends Store<Event, Acc> {
	public isFinal: (acc: Acc) => acc is Final
	constructor(
		reducer: Reducer<Event, Acc>,
		initalArg: Param,
		init: (p: Param) => Acc,
		isFinal: (acc: Acc) => acc is Final,
	) {
		super(init(initalArg), reducer)
		this.isFinal = isFinal
	}
}

export class AtomStore<T> extends Store<T, T> {
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
