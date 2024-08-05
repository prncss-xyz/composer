import { Machine } from '../machine'
import { id, Init, isFunction } from '../utils'

type Reducer<T, Acc> = (t: T, acc: Acc) => Acc | undefined

export class Subcribable<Acc> {
	protected acc: Acc
	private subscribers: Set<(t: Acc) => void> = new Set()
	constructor(init: Acc) {
		this.acc = init
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

export class ReducerStore<T, Acc, Param> extends Subcribable<Acc> {
	private reducer: Reducer<T, Acc>
	constructor(
		reducer: Reducer<T, Acc>,
		initalArg: Param,
		init: (p: Param) => Acc,
	) {
		super(init(initalArg))
		this.reducer = reducer
	}
	put(v: T) {
		const next = this.reducer(v, this.acc)
		if (next === undefined || next === this.acc) return
		this.acc = next
		this.notify()
	}
}

export class MachineStore<
	Param,
	Events extends { type: string },
	State,
	Getters extends Record<PropertyKey, (...props: never[]) => unknown>,
> extends ReducerStore<Events, State, Param> {
	_getters: <Key extends keyof Getters>(key: Key, state: State) => Getters[Key]
	constructor(machine: Machine<Events, State, Param, Getters>, param: Param) {
		const reducer = machine.send.bind(machine)
		const init = machine.init.bind(machine)
		super(reducer, param, init)
    this._getters = machine._getters
	}
	getter<Key extends keyof Getters>(key: Key): (state: State) => Getters[Key] {
		return (state: State) => this._getters(key, state)
	}
}

export class DerivedStore<T, Acc> extends Subcribable<T> {
	source: Subcribable<Acc>
	select: (t: Acc) => T
	areEqual: (value1: unknown, value2: unknown) => boolean
	constructor(
		source: Subcribable<Acc>,
		select: (t: Acc) => T,
		areEqual = Object.is,
	) {
		super(select(source.peek()))
		this.source = source
		this.select = select
		this.areEqual = areEqual
		source.subscribe((acc) => {
			const next = select(acc)
			if (areEqual(this.acc, next)) return
			this.acc = next
			this.notify()
		})
	}
}

export class StateStore<T> extends ReducerStore<T, T, undefined> {
	constructor(init: Init<T>, reducer: Reducer<T, T> = id) {
		if (isFunction(init)) super(reducer, undefined, init)
		else super(reducer, undefined, () => init)
	}
	modify(f: (t: T) => T) {
		this.put(f(this.acc))
	}
	update(t: T | ((t: T) => T)) {
		if (isFunction(t)) this.put(t(this.acc))
		else this.put(t)
	}
}
