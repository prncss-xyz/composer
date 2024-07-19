import { id } from '../utils'
import {
	getter,
	getterOpt,
	lens,
	Optic,
	optional,
	removable,
	REMOVE,
} from './core'

export * from './core'
export type * from './core'

// isomorphisms

// ideally, typesystem whould reject any use of reduce instead of making it inert
// defective

export function to<B, V>(select: (v: V) => B) {
	return getter<B, V>({
		getter: select,
	})
}

export function toOpt<B, V>(select: (v: V) => B | undefined) {
	return getterOpt<B, V>({
		getter: select,
	})
}

// impure
export function log<V>(message = '') {
	return lens<V, V>({
		getter: (v) => {
			console.log(message, 'reading', v)
			return v
		},
		setter: (b, v) => {
			console.log(message, 'writing', b, v)
			return b
		},
	})
}

export function reread<A>(f: (a: A) => A) {
	return lens<A, A>({
		getter: f,
		// TODO: which behavior is better?
		setter: id,
		/* setter: (_, a) => a, */
	})
}

export function rewrite<A>(f: (next: A, last: A) => A) {
	return lens<A, A>({
		getter: id,
		setter: f,
	})
}

export function dedupe<A>(areEqual: (a: A, b: A) => unknown = Object.is) {
	return rewrite<A>((next, last) => {
		if (areEqual(next, last)) return last
		return next
	})
}

export function indexed<T>() {
	return lens({
		getter: (xs: T[]) => xs.map((v, i) => [i, v] as const),
		setter: (entries: (readonly [number, T])[]) => {
			const res: T[] = []
			for (const [index, value] of entries) {
				res[index] = value
			}
			return res
		},
	})
}

export function split(separator = ',') {
	return lens<string[], string>({
		getter: (str) => str.split(separator),
		setter: (xs) => {
			return xs.join(separator)
		},
	})
}

export function linear(m: number, b = 0) {
	return lens<number, number>({
		getter: (x) => m * x + b,
		setter: (y) => (y - b) / m,
	})
}

// lenses

export function nth<Index extends keyof O & number, O extends unknown[]>(
	index: Index,
) {
	return lens<O[Index], O>({
		getter: (o) => o[index],
		setter: (v, o) => o.with(index, v) as O,
	})
}

export function filter<X, Y extends X>(
	p: (x: X) => x is Y,
): <A, F, C>(o: Optic<X[], A, F, C>) => Optic<Y[], A, F, never>
export function filter<X>(
	p: (x: X) => unknown,
): <A, F, C>(o: Optic<X[], A, F, C>) => Optic<X[], A, F, never>
export function filter<X>(p: (x: X) => unknown) {
	return lens({
		getter: (xs: X[]) => xs.filter(p),
		setter: (fs: X[], xs: X[]) => {
			const rs = []
			let i = 0
			let j = 0
			let k = 0
			for (i = 0; i < xs.length; i++) {
				const x = xs[i]
				if (p(x)) {
					if (j < fs.length) {
						rs[k++] = fs[j++]
					}
				} else {
					rs[k++] = x
				}
			}
			for (; j < fs.length; j++, i++) {
				rs[k++] = fs[j]
			}
			return rs
		},
	})
}

// equivalence relation
export function includes<X>(x: X) {
	return lens<boolean, X[]>({
		getter: (xs) => xs.includes(x),
		setter: (v, xs) => {
			if (xs.includes(x) === v) return xs
			if (v) return [...xs, x]
			return xs.filter((x_) => x_ !== x)
		},
	})
}

// prisms

export function when<V, W extends V>(
	p: (v: V) => v is W,
): <A, F, C>(o: Optic<V, A, F, C>) => Optic<W, A, F | undefined, never>
export function when<V>(
	p: (v: V) => unknown,
): <A, F, C>(o: Optic<V, A, F, C>) => Optic<V, A, F | undefined, never>
export function when<V>(p: (v: V) => unknown) {
	return optional<V, V>({
		getter: (v) => (p(v) ? v : undefined),
		setter: id,
	})
}

export function strToNum() {
	return optional({
		getter: (s: string) => {
			const num = Number(s)
			if (isNaN(num)) return undefined
			return num
		},
		setter: (n) => String(n),
	})
}

// removables

type OptionalKeys<T> = {
	[K in keyof T]: object extends Pick<T, K> ? K : never
}[keyof T]

export function prop<Key extends keyof O, O>(
	key: Key,
): <A, F1, C>(
	p: Optic<O, A, F1, C>,
) => Optic<
	Exclude<O[Key], undefined>,
	A,
	F1 | (Key extends OptionalKeys<O> ? undefined : never),
	Key extends OptionalKeys<O> ? typeof REMOVE : never
>
export function prop<Key extends keyof O, O>(key: Key) {
	return removable<Exclude<O[Key], undefined>, O>({
		getter: (o) => o[key] as Exclude<O[Key], undefined>,
		setter: (v, o) => ({ ...o, [key]: v }),
		remover: (o) => {
			const res = { ...o }
			delete res[key]
			return res
		},
	})
}

function adjust(index: number, length: number) {
	return length < 0 ? length + index : index
}
export function at<X>(index: number) {
	return removable<X, X[]>({
		getter: (xs) => xs.at(index),
		setter: (x: X, xs) => (index < xs.length ? xs.with(index, x) : xs),
		remover: (xs) => xs.toSpliced(adjust(index, xs.length)),
	})
}

// defective (when setting a value not repecting predicate)
export function find<X, Y extends X>(
	p: (x: X) => x is Y,
): <A, F, C>(o: Optic<X[], A, F, C>) => Optic<Y, A, undefined, typeof REMOVE>
export function find<X>(
	p: (x: X) => unknown,
): <A, F, C>(o: Optic<X[], A, F, C>) => Optic<X, A, undefined, typeof REMOVE>
export function find<X>(p: (x: X) => unknown) {
	return removable({
		getter: (xs: X[]) => xs.find(p),
		setter: (x: X, xs: X[]) => {
			const i = xs.findIndex(p)
			if (i < 0) return [...xs, x]
			xs = [...xs]
			xs[i] = x
			return xs
		},
		remover: (xs: X[]) => {
			const i = xs.findIndex(p)
			if (i < 0) return xs
			const r = xs.slice(0, i)
			r.push(...xs.slice(i + 1))
			return r
		},
	})
}

export function tail<X>() {
	return removable<X[], X[]>({
		getter: (last) => (last.length ? last.slice(1) : undefined),
		setter: (next, last) => (last.length ? [last[0], ...next] : last),
		remover: (last) => (last.length ? last.slice(0, 1) : last),
	})
}

// defective
// aka prepend
// can represent a stack, although foot is more efficient
export function head<X>() {
	return removable<X, X[]>({
		getter: (xs) => xs.at(0),
		setter: (x, xs) => [x, ...xs],
		remover: (xs) => xs.slice(1),
	})
}

// defective
// aka append
// can represent a stack
export function foot<X>() {
	return removable<X, X[]>({
		getter: (xs) => xs.at(-1),
		setter: (x, xs) => [...xs, x],
		remover: (xs) => xs.slice(0, -1),
	})
}

// defective
export function queue<X>() {
	return removable<X, X[]>({
		getter: (xs) => xs.at(0),
		setter: (x, xs) => [...xs, x],
		remover: (xs) => xs.slice(1),
	})
}