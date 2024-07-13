// TODO:
import { flow } from '../flow'
import { id } from '../utils'
import { eq, optional } from './core'

function isString2(x: unknown) {
	return typeof x === 'string'
}

function isString(x: string | number) {
	return typeof x === 'string'
}

function guard<V, W extends V>(
	p: ((v: V) => v is W) | ((v: unknown) => v is W),
	/* p: | ((v: unknown) => v is W), */
) {
	return optional<W, V>({
		select: (v) => (p(v) ? v : undefined),
		reduce: id,
	})
}

function guard_<V, W>(p: (v: V | W) => v is W) {
	return optional<W, V | W>({
		select: (v) => (p(v) ? v : undefined),
		reduce: id,
	})
}

describe('guard', () => {
	type Source = string | number

	const focus = flow(eq<Source>(), guard(isString))
	flow(eq<Source>(), guard(isString2))

	const sourceDefined: Source = 'toto'
	const sourceUndefined: Source = 5
	describe('view', () => {
		it('defined', () => {
			const res = focus.view(sourceDefined)
			expectTypeOf(res).toEqualTypeOf<string | undefined>()
			expect(res).toBe('toto')
		})
		it('undefined', () => {
			const res = focus.view(sourceUndefined)
			expectTypeOf(res).toEqualTypeOf<string | undefined>()
			expect(res).toBeUndefined()
		})
	})
})
