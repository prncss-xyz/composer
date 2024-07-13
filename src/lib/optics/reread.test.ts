import { reread } from '.'
import { flow } from '../flow'
import { eq } from './core'

describe('reread', () => {
	const focus = flow(
		eq<string>(),
		reread((s) => s.toUpperCase()),
	)
	it('view', () => {
		expect(focus.view('foo')).toBe('FOO')
	})
	it('put', () => {
		expect(focus.put('', 'foo')).toBe('foo')
	})
})
