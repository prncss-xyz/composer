import { indexed } from '.'
import { flow } from '../utils/flow'
import { eq } from './core'

describe('indexed', () => {
	const focus = flow(eq<string[]>(), indexed())
	it('view', () => {
		expect(focus.view(['a', 'b'])).toEqual([
			[0, 'a'],
			[1, 'b'],
		])
	})
	it('put', () => {
		expect(
			focus.put(
				[
					[0, 'a'],
					[2, 'c'],
				],
				[],
			),
		).toEqual(['a', undefined, 'c'])
	})
})
