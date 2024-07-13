import { eqWithReset, RESET } from './core'

describe('core', () => {
	test('eqWithReset', () => {
		const focus = eqWithReset(1)
		expect(focus.command(RESET, 2)).toEqual(1)
	})
})
