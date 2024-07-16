import { find } from '.'
import { flow } from '../utils/flow'
import { eq, REMOVE } from './core'

describe('find', () => {
	type Source = { bar: string }
	const sourceDefined: Source[] = [
		{ bar: 'baz' },
		{ bar: 'quux' },
		{ bar: 'xyzzy' },
	]
	const sourceUndefined: Source[] = [
		{ bar: 'baz' },
		{ bar: 'nomatch' },
		{ bar: 'xyzzy' },
	]
	const focus = flow(
		eq<Source[]>(),
		find((item) => item.bar === 'quux'),
	)
	describe('view', () => {
		it('defined', () => {
			expect(focus.view(sourceDefined)).toEqual({ bar: 'quux' })
		})
		it('undefined', () => {
			expect(focus.view(sourceUndefined)).toBeUndefined()
		})
	})
	describe('modify', () => {
		it('defined', () => {
			expect(
				focus.modify(
					(x) => ({
						bar: `${x.bar} UPDATED`,
					}),
					sourceDefined,
				),
			).toEqual([{ bar: 'baz' }, { bar: 'quux UPDATED' }, { bar: 'xyzzy' }])
		})
		it('undefined', () => {
			expect(
				focus.modify(
					(x) => ({
						bar: `${x.bar} UPDATED`,
					}),
					sourceUndefined,
				),
			).toEqual(sourceUndefined)
		})
	})
	describe('remove', () => {
		it('defined', () => {
			expect(focus.command(REMOVE, sourceDefined)).toEqual([
				{ bar: 'baz' },
				{ bar: 'xyzzy' },
			])
		})
		it('undefined', () => {
			expect(focus.command(REMOVE, sourceUndefined)).toEqual(sourceUndefined)
		})
	})
})
