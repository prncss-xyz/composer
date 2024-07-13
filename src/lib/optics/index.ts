import { id } from '../utils'
import {
	lens,
	removable,
	optional,
	getter,
	getterOpt,
	REMOVE,
	Optic,
} from './core'

// isomorphisms

// ideally, typesystem whould reject any use of reduce instead of making it inert
// defective
export function to<B, V>(select: (v: V) => B) {
	return getter<B, V>({
		select,
	})
}

// impure
export function log<V>(message = '') {
	return lens<V, V>({
		select: (v) => {
			console.log(message, 'reading', v)
			return v
		},
		reduce: (b, v) => {
			console.log(message, 'writing', b, v)
			return b
		},
	})
}

export function reread<A>(f: (a: A) => A) {
	return lens<A, A>({
		select: f,
		// TODO: which behavior is better?
		reduce: id,
		/* reduce: (_, a) => a, */
	})
}

export function rewrite<A>(f: (next: A, last: A) => A) {
	return lens<A, A>({
		select: id,
		reduce: f,
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
		select: (xs: T[]) => xs.map((v, i) => [i, v] as const),
		reduce: (entries: (readonly [number, T])[]) => {
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
		select: (str) => str.split(separator),
		reduce: (xs) => {
			return xs.join(separator)
		},
	})
}

export function linear(m: number, b = 0) {
	return lens<number, number>({
		select: (x) => m * x + b,
		reduce: (y) => (y - b) / m,
	})
}

// lenses

export function filter<X>(p: (x: X) => unknown) {
	return lens({
		select: (xs: X[]) => xs.filter(p),
		reduce: (fs: X[], xs: X[]) => {
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
		select: (xs) => xs.includes(x),
		reduce: (v, xs) => {
			if (xs.includes(x) === v) return xs
			if (v) return [...xs, x]
			return xs.filter((x_) => x_ !== x)
		},
	})
}

// prisms

export function when<V>(p: (v: V) => unknown) {
	return optional<V, V>({
		select: (v) => (p(v) ? v : undefined),
		reduce: id,
	})
}

export function strToNum() {
	return optional({
		select: (s: string) => {
			const num = Number(s)
			if (isNaN(num)) return undefined
			return num
		},
		reduce: (n) => String(n),
	})
}

export function toOpt<B, V>(select: (v: V) => B | undefined) {
	return getterOpt<B, V>({
		select,
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
	F1 | Key extends OptionalKeys<O> ? undefined : never,
	Key extends OptionalKeys<O> ? typeof REMOVE : never
>
export function prop<Key extends keyof O, O>(key: Key) {
	return removable<Exclude<O[Key], undefined>, O>({
		select: (o) => o[key] as Exclude<O[Key], undefined>,
		reduce: (v, o) => ({ ...o, [key]: v }),
		remove: (o) => {
			const res = { ...o }
			delete res[key]
			return res
		},
	})
}

export function at<X>(b: number) {
	return removable<X, X[]>({
		select: (xs) => xs.at(b),
		reduce: (x: X, xs) => (b < xs.length ? xs.with(b, x) : xs),
		remove: (xs) => xs.toSpliced(b),
	})
}

export function find<X>(p: (x: X) => unknown) {
	return removable({
		select: (xs: X[]) => xs.find(p),
		reduce: (x: X, xs: X[]) => {
			const i = xs.findIndex(p)
			if (i < 0) return [...xs, x]
			xs = [...xs]
			xs[i] = x
			return xs
		},
		remove: (xs: X[]) => {
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
		select: (last) => (last.length ? last.slice(1) : undefined),
		reduce: (next, last) => (last.length ? [last[0], ...next] : last),
		remove: (last) => (last.length ? last.slice(0, 1) : last),
	})
}

// defective
// aka prepend
export function head<X>() {
	return removable<X, X[]>({
		select: (xs) => xs.at(0),
		reduce: (x, xs) => [x, ...xs],
		remove: (xs) => xs.slice(1),
	})
}

// defective
// aka append
export function foot<X>() {
	return removable<X, X[]>({
		select: (xs) => xs.at(-1),
		reduce: (x, xs) => [...xs, x],
		remove: (xs) => xs.slice(0, -1),
	})
}
