import { id, Init, initToVal, isFunction } from '../utils'

function isNever(_v: unknown): _v is never {
	return false
}

function isUndefined(v: unknown) {
	return v === undefined
}

export const RESET = Symbol('RESET')
function isReset(v: unknown) {
	return v === RESET
}

export const REMOVE = Symbol('REMOVE')
function isRemove(v: unknown) {
	return v === REMOVE
}

function forbidden<T, U>(_: T, _u: U): U {
	throw new Error('this is a getter only optic, don not use a setter')
}

function inert<T, U>(_: T, u: U) {
	return u
}

interface IOptic<V, A, F, C> {
	select: (a: A) => V | F
	isFaillure: (v: unknown) => v is F
	reduce: (v: V, a: A) => A
	isCommand: (v: unknown) => v is C
	exec: (c: C, a: A) => A
}

type F<T, U> = (v: unknown) => v is T | U
function composeFaillure<F1, F2>(
	f1: (v: unknown) => v is F1,
	f2: (v: unknown) => v is F2,
) {
	if (f1 === isNever) return f2 as F<F1, F2>
	if (f2 === isNever) return f1 as F<F1, F2>
	if ((f1 as unknown) === f2) return f1 as F<F1, F2>
	/* c8 ignore start */
	throw new Error('unexpected faillure value')
}
/* c8 ignore stop */

export class Optic<V, A, F, C> {
	private select: (a: A) => V | F
	private isFaillure: (v: unknown) => v is F
	private reduce: (v: V, a: A) => A
	private isCommand: (v: unknown) => v is C
	private exec: (c: C, a: A) => A
	private constructor(o: IOptic<V, A, F, C>) {
		this.select = o.select
		this.isFaillure = o.isFaillure
		this.reduce = o.reduce
		this.isCommand = o.isCommand
		this.exec = o.exec
	}
	_compose<B, F2, C2>(o: IOptic<B, V, F2, C2>) {
		// this is an optimization, it should not change behavior
		if (this.isFaillure === isNever)
			return new Optic<B, A, F2, C2>({
				select: (a) => o.select(this.select(a) as V),
				isFaillure: o.isFaillure,
				reduce: (b, a) => this.reduce(o.reduce(b, this.select(a) as V), a),
				isCommand: o.isCommand,
				exec: (c, a) => this.reduce(o.exec(c, this.select(a) as V), a),
			})
		return new Optic<B, A, F | F2, C2>({
			select: (a) => {
				const t = this.select(a)
				if (this.isFaillure(t)) return t
				return o.select(t)
			},
			isFaillure: composeFaillure(this.isFaillure, o.isFaillure),
			reduce: (b, a) => {
				const t = this.select(a)
				if (this.isFaillure(t)) return a
				return this.reduce(o.reduce(b, t), a)
			},
			isCommand: o.isCommand,
			exec: (c, a) => {
				const t = this.select(a)
				if (this.isFaillure(t)) return a
				return this.reduce(o.exec(c, t), a)
			},
		})
	}
	view(a: A) {
		return this.select(a)
	}
	put(v: V, a: A) {
		return this.reduce(v, a)
	}
	command(c: C, a: A) {
		return this.exec(c, a)
	}
	modify(f: (v: V) => V, a: A) {
		const v = this.select(a)
		if (this.isFaillure(v)) return a
		return this.reduce(f(v), a)
	}
	update(arg: C | V | ((v: V) => V), a: A) {
		if (this.isCommand(arg)) return a
		if (isFunction(arg)) return this.modify(arg, a)
		return this.put(arg, a)
	}
	static eq<T, C>({
		isCommand,
		exec,
	}: {
		isCommand: (v: unknown) => v is C
		exec: (c: C, a: T) => T
	}) {
		return new Optic({
			select: id,
			isFaillure: isNever,
			reduce: id<T>,
			isCommand,
			exec,
		})
	}
}

export type Eq<T> = Optic<T, T, never, never>
export function eq<T>() {
	return Optic.eq<T, never>({ isCommand: isNever, exec: id })
}

export type EqWithReset<T> = Optic<T, T, typeof RESET, never>
export function eqWithReset<T>(init: Init<T>) {
	return Optic.eq<T, typeof RESET>({
		isCommand: isReset,
		exec: () => initToVal(init),
	})
}

export function lens<B, V>({
	select,
	reduce,
}: {
	select: (v: V) => B
	reduce: (b: B, v: V) => V
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose<B, F, never>({
			select,
			isFaillure: isNever,
			reduce,
			isCommand: isNever,
			exec: inert,
		})
	}
}

export function optional<B, V>({
	select,
	reduce,
}: {
	select: (v: V) => B | undefined
	reduce: (b: B, v: V) => V
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose({
			select,
			isFaillure: isUndefined,
			reduce,
			isCommand: isNever,
			exec: inert,
		})
	}
}

export function removable<B, V>({
	select,
	reduce,
	remove,
}: {
	select: (v: V) => B | undefined
	reduce: (b: B, v: V) => V
	remove: (v: V) => V
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose({
			select,
			isFaillure: isUndefined,
			reduce,
			isCommand: isRemove,
			exec: (_, a) => remove(a),
		})
	}
}

export function getter<B, V>({ select }: { select: (v: V) => B }) {
	return lens<B, V>({
		select,
		reduce: forbidden,
	})
}

export function getterOpt<B, V>({
	select,
}: {
	select: (v: V) => B | undefined
}) {
	return optional<B, V>({
		select,
		reduce: forbidden,
	})
}
