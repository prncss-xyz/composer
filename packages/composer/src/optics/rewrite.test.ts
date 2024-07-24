import { rewrite } from '.'
import { flow } from '../utils/flow'
import { eq } from './core'

describe('rewrite', () => {
	const focus = flow(
		eq<string>(),
		rewrite((s) => s.toUpperCase()),
	)
	it('view', () => {
		expect(focus.view('foo')).toBe('foo')
	})
	it('put', () => {
		expect(focus.put('foo')('')).toBe('FOO')
	})
})
