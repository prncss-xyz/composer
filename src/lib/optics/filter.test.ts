import { filter } from '.'
import { flow } from '../flow'
import { eq } from './core'

describe('filter', () => {
	it('view', () => {
		type Source = string[]
		const source: Source = ['baz', 'quux', 'xyzzy']
		const focus = flow(
			eq<Source>(),
			filter((item) => item !== 'quux'),
		)
		expect(focus.view(source)).toEqual(['baz', 'xyzzy'])
	})
	describe('put', () => {
		it('put the same numbers of items', () => {
			type Source = string[]
			const source: Source = ['baz', 'quux', 'xyzzy']
			const focus = flow(
				eq<Source>(),
				filter((item) => item !== 'quux'),
			)
			expect(focus.put(['BAZ', 'XYZZY'], source)).toEqual([
				'BAZ',
				'quux',
				'XYZZY',
			])
		})
		it('put fewer items', () => {
			type Item = number | string
			type Source = Item[]
			const source: Source = [1, 2, 3, 5, 6]
			const isOdd = (x: Item) => typeof x === 'number' && x % 2 === 1
			const focus = flow(eq<Source>(), filter(isOdd))
			const result = focus.put(['foo', 'bar'], source)
			expect(result).toEqual(['foo', 2, 'bar', 6])
		})
		it('put more items', () => {
			type Item = number | string
			type Source = Item[]
			const source: Source = [1, 2, 3, 5, 6]
			const isOdd = (x: Item) => typeof x === 'number' && x % 2 === 1
			const focus = flow(eq<Source>(), filter(isOdd))
			const result = focus.put(['foo', 'bar', 'baz', 'quux', 'xyzzy'], source)
			expect(result).toEqual(['foo', 2, 'bar', 'baz', 6, 'quux', 'xyzzy'])
		})
	})
	// TODO: narrow type
})
