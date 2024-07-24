import { nth } from '.'
import { flow } from '../utils/flow'
import { eq } from './core'

describe('nth', () => {
	type Source = [number, string, boolean]
	const source: Source = [1, 'a', true]
	const focus = flow(eq<Source>(), nth(1))
	it('view', () => {
		const res = focus.view(source)
		expectTypeOf(res).toEqualTypeOf<string>()
		expect(res).toBe('a')
	})
	it('put', () => {
		const res = focus.put('A')(source)
		expect(res).toEqual([1, 'A', true])
		expectTypeOf(res).toEqualTypeOf<Source>()
	})
})
