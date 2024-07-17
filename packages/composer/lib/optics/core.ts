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
	getter: (a: A) => V | F
	isFaillure: (v: unknown) => v is F
	setter: (v: V, a: A) => A
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

export class Optic<V, A, F, C> implements IOptic<V, A, F, C> {
	getter
	isFaillure
	setter
	isCommand
	exec
	private constructor(o: IOptic<V, A, F, C>) {
		this.getter = o.getter
		this.isFaillure = o.isFaillure
		this.setter = o.setter
		this.isCommand = o.isCommand
		this.exec = o.exec
	}
	_compose<B, F2, C2>(o: IOptic<B, V, F2, C2>) {
		// this is an optimization, it should not change behavior
		// PERF: check when function is eqaul to `utils/id`
		if (this.isFaillure === isNever)
			return new Optic<B, A, F2, C2>({
				getter: (a) => o.getter(this.getter(a) as V),
				isFaillure: o.isFaillure,
				setter: (b, a) => this.setter(o.setter(b, this.getter(a) as V), a),
				isCommand: o.isCommand,
				exec: (c, a) => this.setter(o.exec(c, this.getter(a) as V), a),
			})
		return new Optic<B, A, F | F2, C2>({
			getter: (a) => {
				const t = this.getter(a)
				if (this.isFaillure(t)) return t
				return o.getter(t)
			},
			isFaillure: composeFaillure(this.isFaillure, o.isFaillure),
			setter: (b, a) => {
				const t = this.getter(a)
				if (this.isFaillure(t)) return a
				return this.setter(o.setter(b, t), a)
			},
			isCommand: o.isCommand,
			exec: (c, a) => {
				const t = this.getter(a)
				if (this.isFaillure(t)) return a
				return this.setter(o.exec(c, t), a)
			},
		})
	}
	view(a: A) {
		return this.getter(a)
	}
	put(v: V, a: A) {
		return this.setter(v, a)
	}
	command(c: C, a: A) {
		return this.exec(c, a)
	}
	modify(f: (v: V) => V, a: A) {
		const v = this.getter(a)
		if (this.isFaillure(v)) return a
		return this.setter(f(v), a)
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
			getter: id,
			isFaillure: isNever,
			setter: id<T>,
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
	getter,
	setter,
}: {
	getter: (v: V) => B
	setter: (b: B, v: V) => V
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose<B, F, never>({
			getter: getter,
			isFaillure: isNever,
			setter: setter,
			isCommand: isNever,
			exec: inert,
		})
	}
}

export function optional<B, V>({
	getter,
	setter,
}: {
	getter: (v: V) => B | undefined
	setter: (b: B, v: V) => V
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose({
			getter: getter,
			isFaillure: isUndefined,
			setter: setter,
			isCommand: isNever,
			exec: inert,
		})
	}
}

export function removable<B, V>({
	getter,
	setter,
	remover,
}: {
	getter: (v: V) => B | undefined
	setter: (b: B, v: V) => V
	remover: (v: V) => V
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose({
			getter: getter,
			isFaillure: isUndefined,
			setter: setter,
			isCommand: isRemove,
			exec: (_, a) => remover(a),
		})
	}
}

export function getter<B, V>({ getter }: { getter: (v: V) => B }) {
	return lens<B, V>({
		getter: getter,
		setter: forbidden,
	})
}

export function getterOpt<B, V>({
	getter,
}: {
	getter: (v: V) => B | undefined
}) {
	return optional<B, V>({
		getter: getter,
		setter: forbidden,
	})
}
