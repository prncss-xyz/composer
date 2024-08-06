/* eslint-disable @typescript-eslint/no-explicit-any */
import { fromInit, id, Init, isFunction, isNever, Monoid } from '../utils'

function cmp<P, Q, R>(f: (p: P) => Q, g: (q: Q) => R): (p: P) => R {
	if (f === id) return g as unknown as (p: P) => R
	if (g === id) return f as unknown as (p: P) => R
	return (p: P) => g(f(p))
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

function notImplemented(): any {
	throw new Error('not implemented')
}

function apply<P, Q>(f: (p: P) => Q, p: P) {
	return f(p)
}

function inert<T, U>(_: T, u: U) {
	return u
}

type Fold<Value, Acc> = (v: Value, acc: Acc) => Acc
type Mapper<Part, Whole> = (f: (v: Part) => Part, b: Whole) => Whole
type Setter<Part, Whole> = (p: Part, w: Whole) => Whole

interface IOptic<Part, Whole, Fail, Command> {
	getter: (a: Whole) => Part | Fail
	refold: <Acc>(f: Fold<Part, Acc>) => Fold<Whole, Acc>
	mapper: Mapper<Part, Whole>
	isFaillure: (v: unknown) => v is Fail
	setter: Setter<Part, Whole>
	isCommand: (v: unknown) => v is Command
	exec: Setter<Command, Whole>
}

interface IOpticArg<Part, Whole, Fail, Command> {
	getter: (a: Whole) => Part | Fail
	refold: <Acc>(f: Fold<Part, Acc>) => Fold<Whole, Acc>
	mapper: Mapper<Part, Whole>
	isFaillure: (v: unknown) => v is Fail
	setter: (v: Part, a: Whole) => Whole
	isCommand: (v: unknown) => v is Command
	exec: (c: Command, a: Whole) => Whole
}

function cmpFaillure<F1, F2>(
	f1: (v: unknown) => v is F1,
	f2: (v: unknown) => v is F2,
): (v: unknown) => v is F1 | F2 {
	if (f1 === isNever) return f2
	if (f2 === isNever) return f1
	if ((f1 as unknown) === f2) return f1
	/* c8 ignore start */
	throw new Error('unexpected faillure value')
}
/* c8 ignore stop */

function newSetter<B, Part, Whole>(
	thisSetter: Setter<Part, Whole>,
	oSetter: Setter<B, Part>,
): (b: B, part: Part, w: Whole) => Whole {
	if (thisSetter === id) {
		if (oSetter === id) return id as any
		return (b, p) => oSetter(b, p) as any
	}
	if (oSetter === id) return (b, _p, w) => oSetter(b, w as any) as any
	return (b, p, w) => thisSetter(oSetter(b, p), w)
}

function cmpSetter<B, Part, Whole>(
	thisGetter: (a: Whole) => Part,
	thisSetter: Setter<Part, Whole>,
	oSetter: Setter<B, Part>,
): Setter<B, Whole> {
	if (thisSetter === id) {
		if (oSetter === id) return id as any
		if (thisGetter === id) return (b, w) => oSetter(b, w as any) as any
		if (thisSetter === id)
			return (b, w) => oSetter(b, thisGetter(w) as Part) as any
	}
	if (oSetter === id) return (b, w) => thisSetter(b as any, w) as any
	if (thisGetter === id)
		return (b, w) => thisSetter(oSetter(b, w as any), w) as any
	return (b: B, w: Whole) => thisSetter(oSetter(b, thisGetter(w) as Part), w)
}

function cmpMapper<B, Part, Whole>(
	thisMapper: Mapper<Part, Whole>,
	oMapper: Mapper<B, Part>,
): Mapper<B, Whole> {
	if (thisMapper === apply) return oMapper as any
	return (f, w) => thisMapper((p) => oMapper(f, p), w)
}

export class Optic<Part, Whole, Fail, Command>
	implements IOptic<Part, Whole, Fail, Command>
{
	getter
	refold
	mapper
	isFaillure
	setter
	isCommand
	exec
	private constructor(o: IOptic<Part, Whole, Fail, Command>) {
		this.getter = o.getter
		this.refold = o.refold
		this.mapper = o.mapper
		this.isFaillure = o.isFaillure
		this.setter = o.setter
		this.isCommand = o.isCommand
		this.exec = o.exec
	}
	_compose<B, F2, C2>(o: IOpticArg<B, Part, F2, C2>) {
		const exec: Setter<C2, Whole> =
			o.exec === inert
				? (inert as any)
				: (c: C2, w: Whole) => this.mapper((p) => o.exec(c, p), w)
		if (this.isFaillure === isNever) {
			return new Optic<B, Whole, Fail | F2, C2>({
				getter: cmp(this.getter as (w: Whole) => Part, o.getter),
				refold: cmp(o.refold, this.refold),
				mapper: cmpMapper(this.mapper, o.mapper),
				isFaillure: cmpFaillure(this.isFaillure, o.isFaillure),
				setter: cmpSetter(this.getter as any, this.setter, o.setter),
				isCommand: o.isCommand,
				exec,
			})
		}
		const isFaillure = cmpFaillure(this.isFaillure, o.isFaillure)
		const refold = cmp(o.refold, this.refold)
		const ns = newSetter(this.setter, o.setter)
		return new Optic<B, Whole, Fail | F2, C2>({
			getter:
				o.getter === id
					? (this.getter as any)
					: (w: Whole) => {
							const p = this.getter(w)
							if (this.isFaillure(p)) return p
							return o.getter(p)
						},
			refold,
			mapper: cmpMapper(this.mapper, o.mapper),
			isFaillure,
			setter: (b, w) => {
				const t = this.getter(w)
				if (this.isFaillure(t)) return w
				return ns(b, t, w)
			},
			isCommand: o.isCommand,
			exec,
		})
	}
	view(a: Whole) {
		return this.getter(a)
	}
	put(v: Part) {
		return (a: Whole) => this.setter(v, a)
	}
	fold<Acc>(monoid: Monoid<Part, Acc>) {
		const fold = this.refold(monoid.fold)
		return (w: Whole) => fold(w, fromInit(monoid.init))
	}
	command(c: Command) {
		return (w: Whole) => this.exec(c, w)
	}
	modify(f: (p: Part) => Part) {
		return (w: Whole) => this.mapper(f, w)
	}
	update(arg: Command | Part | ((p: Part) => Part)) {
		if (this.isCommand(arg)) return this.command(arg)
		if (isFunction(arg)) return this.modify(arg)
		return this.put(arg)
	}
	static eq<T, C>({
		isCommand,
		exec,
	}: {
		isCommand: (v: unknown) => v is C
		exec: (c: C, t: T) => T
	}) {
		return new Optic({
			getter: id<T>,
			refold: id,
			mapper: apply,
			isFaillure: isNever,
			setter: id,
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
		exec: () => fromInit(init),
	})
}

export function traversal<B, V>({
	refold,
	mapper,
}: {
	refold: <Acc>(fold: Fold<B, Acc>) => Fold<V, Acc>
	mapper: Mapper<B, V>
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose<B, F, never>({
			getter: notImplemented,
			setter: notImplemented,
			refold,
			mapper,
			isFaillure: isNever,
			isCommand: isNever,
			exec: inert,
		})
	}
}

function mkMapper<B, V>(
	setter: (b: B, v: V) => V,
	getter: (v: V) => B,
): (f: (v: B) => B, v: V) => V {
	if (setter === id && getter === id) return id as any
	if (setter === id) return (f, v) => f(getter(v)) as any
	if (getter === id) return (f, v) => setter(f(v as any), v) as any
	return (f: (v: B) => B, v: V) => setter(f(getter(v)), v)
}

export function lens<B, V>({
	getter,
	setter,
}: {
	getter: (v: V) => B
	setter: Setter<B, V>
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose<B, F, never>({
			getter,
			// TODO: optimize for getter === id and setter === id
			refold: (fold) =>
				getter === id ? (fold as any) : (v, acc) => fold(getter(v), acc),
			mapper: mkMapper(setter, getter),
			isFaillure: isNever,
			setter,
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
	setter: Setter<B, V>
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose({
			getter,
			refold:
				<Acc>(fold: Fold<B, Acc>) =>
				(v, acc: Acc) => {
					const b = getter(v)
					if (b === undefined) return acc
					return fold(b, acc)
				},
			mapper: (f, v) => {
				const b = getter(v)
				if (b === undefined) return v
				return setter(f(b), v)
			},
			isFaillure: isUndefined,
			setter,
			isCommand: isNever,
			exec: inert,
		})
	}
}

export function removable<B, V>({
	getter,
	setter,
	remover,
	mapper,
}: {
	getter: (v: V) => B | undefined
	setter: Setter<B, V>
	remover: (v: V) => V
	mapper?: Mapper<B, V>
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose({
			getter,
			refold:
				<Acc>(fold: Fold<B, Acc>) =>
				(v, acc: Acc) => {
					const b = getter(v)
					if (b === undefined) return acc
					return fold(b, acc)
				},
			mapper:
				mapper ??
				((f, v) => {
					const b = getter(v)
					if (b === undefined) return v
					return setter(f(b), v)
				}),
			isFaillure: isUndefined,
			setter,
			isCommand: isRemove,
			exec: (_, a) => remover(a),
		})
	}
}

export function getter<B, V>({ getter }: { getter: (v: V) => B }) {
	return lens<B, V>({
		getter,
		setter: forbidden,
	})
}

export function getterOpt<B, V>({
	getter,
}: {
	getter: (v: V) => B | undefined
}) {
	return optional<B, V>({
		getter,
		setter: forbidden,
	})
}
