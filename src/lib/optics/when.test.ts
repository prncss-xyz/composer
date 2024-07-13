import { prop, when } from '.'
import { flow } from '../flow'
import { eq } from './core'

describe('when', () => {
	type Source = { foo: number }
	const source1 = { foo: 5 }
	const source2 = { foo: 15 }
	const focus = flow(
		eq<Source>(),
		prop('foo'),
		when((x) => x < 10),
	)
	describe('view', () => {
		it('defined', () => {
			expect(focus.view(source1)).toBe(5)
		})
		it('undefined', () => {
			expect(focus.view(source2)).toBeUndefined()
		})
	})
	describe('modify', () => {
		const opposite = (x: number) => -x
		it('defined', () => {
			expect(focus.modify(opposite, source1)).toEqual({ foo: -5 })
		})
		it('undefined', () => {
			expect(focus.modify(opposite, source2)).toEqual(source2)
		})
	})
})
