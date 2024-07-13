// TODO:
import { flow } from '../flow'
import { eq, lens } from './core'

type K = [number, string, boolean]
type V = [number, ...unknown[]]
const k: K = [1, 'a', true]
const v: V = [1, 'a', true]
/* const l: K = v */
const m: V = k

// FIXME:
export function first<V, P, Q>() {
	return lens<V, [V, ...any[]]>({
		select: (xs) => {
			const res = xs[0]
			return res
		},
		reduce: (_x: V, xs) => {
			return xs
		},
	})
}

describe('tuples', () => {
	type Source = [number, string, boolean]
	const x: [number, ...unknown[]] = [1, 'a', true]

	const y: Source = x

	const focus = flow(eq<Source>(), first())
	const source: Source = [1, 'a', true]
	it('view', () => {
		const res = focus.view(source)
		expectTypeOf(res).toEqualTypeOf<number>()
		expect(res).toBe('a')
	})
	it('put', () => {
		const res = focus.put(3, source)
		expect(res).toEqual([3, 'A', true])
		expectTypeOf(res).toEqualTypeOf<Source>()
	})
})
