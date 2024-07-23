import { first, fromInit, id, Init, isFunction, Monoid } from '../utils'

function cmp<P, Q, R>(f: (p: P) => Q, g: (q: Q) => R): (p: P) => R {
	if (f === id) return g as unknown as (p: P) => R
	if (g === id) return f as unknown as (p: P) => R
	return (p: P) => g(f(p))
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notImplemented(): any {
	throw new Error('not implemented')
}

function inert<T, U>(_: T, u: U) {
	return u
}

type Fold<Value, Acc> = (v: Value, acc: Acc) => Acc
type Mapper<Part, Whole> = (f: (v: Part) => Part, b: Whole) => Whole

interface IOptic<Part, Whole, Fail, Command> {
	getter: (a: Whole) => Part | Fail
	refold: <Acc>(f: Fold<Part, Acc>) => Fold<Whole, Acc>
	mapper: Mapper<Part, Whole>
	isFaillure: (v: unknown) => v is Fail
	setter: (v: Part, a: Whole) => Whole
	isCommand: (v: unknown) => v is Command
	exec: (c: Command, a: Whole) => Whole
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

function composeFaillure<F1, F2>(
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
	// TODO: optimize for setter === id
	// TODO: optimize for mapper === apply
	_compose<B, F2, C2>(o: IOpticArg<B, Part, F2, C2>) {
		if (this.isFaillure === isNever) {
			return new Optic<B, Whole, Fail | F2, C2>({
				getter: cmp(this.getter as (w: Whole) => Part, o.getter),
				refold: cmp(o.refold, this.refold),
				mapper: (f, w) => this.mapper((p) => o.mapper(f, p), w),
				isFaillure: composeFaillure(this.isFaillure, o.isFaillure),
				setter:
					this.setter === id
						? (b: B, w: Whole) =>
								o.setter(b, this.getter(w) as Part) as unknown as Whole
						: (b: B, w: Whole) =>
								this.setter(o.setter(b, this.getter(w) as Part), w),
				isCommand: o.isCommand,
				exec: (c, w) => this.mapper((p) => o.exec(c, p), w),
			})
		}
		const isFaillure = composeFaillure(this.isFaillure, o.isFaillure)
		const refold = cmp(o.refold, this.refold)
		const mapper: Mapper<B, Whole> = (f, w) =>
			this.mapper((p) => o.mapper(f, p), w)
		return new Optic<B, Whole, Fail | F2, C2>({
			getter: (w: Whole) => {
				const p = this.getter(w)
				if (this.isFaillure(p)) return p
				return o.getter(p)
			},
			refold,
			mapper,
			isFaillure,
			setter: (b, w) => {
				const t = this.getter(w)
				if (this.isFaillure(t)) return w
				return this.setter(o.setter(b, t), w)
			},
			isCommand: o.isCommand,
			exec: (c, w) => this.mapper((p) => o.exec(c, p), w),
		})
	}
	view(a: Whole) {
		return this.getter(a)
	}
	put(v: Part, a: Whole) {
		return this.setter(v, a)
	}
	fold<Acc>(monoid: Monoid<Part, Acc>, w: Whole) {
		const acc = fromInit(monoid.init)
		const fold = this.refold(monoid.fold)
		return fold(w, acc)
	}
	command(c: Command, w: Whole) {
		return this.exec(c, w)
	}
	modify(f: (p: Part) => Part, w: Whole) {
		return this.mapper(f, w)
	}
	update(arg: Command | Part | ((p: Part) => Part)) {
		if (this.isCommand(arg)) return (w: Whole) => this.command(arg, w)
		if (isFunction(arg)) return (w: Whole) => this.modify(arg, w)
		return (w: Whole) => this.put(arg, w)
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
			mapper: (f, t) => f(t),
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

export function lens<B, V>({
	getter,
	setter,
}: {
	getter: (v: V) => B
	setter: (b: B, v: V) => V
}) {
	return function <A, F, C>(o: Optic<V, A, F, C>) {
		return o._compose<B, F, never>({
			getter,
      // TODO: optimize for getter === id and setter === id
			refold: (fold) => (v, acc) => fold(getter(v), acc),
			mapper: (f, v) => setter(f(getter(v)), v),
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
	setter: (b: B, v: V) => V
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
}: {
	getter: (v: V) => B | undefined
	setter: (b: B, v: V) => V
	remover: (v: V) => V
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
