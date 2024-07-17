import { linear } from '.'
import { flow } from '../utils/flow'
import { eq } from './core'

describe('linear', () => {
	const focus = flow(eq<number>(), linear(1.8, 32))
	it('celsius to fahrenheit', () => {
		expect(focus.view(-40)).toBe(-40)
		expect(focus.view(100)).toBe(212)
	})
	it('fahrenheit to celsius', () => {
		expect(focus.put(-40, 0)).toBe(-40)
		expect(focus.put(212, 0)).toBe(100)
	})
})
