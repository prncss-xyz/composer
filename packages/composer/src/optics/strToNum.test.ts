import { strToNum } from '.'
import { flow } from '../utils/flow'
import { eq } from './core'

describe('strToNum', () => {
	const focus = flow(eq<string>(), strToNum())
	describe('view', () => {
		it('defined', () => {
			expect(focus.view('24')).toBe(24)
		})
		it('undefined', () => {
			expect(focus.view('foo')).toBeUndefined()
		})
	})
	describe('put', () => {
		it('defined', () => {
			expect(focus.put(10, '24')).toBe('10')
		})
		it('undefined', () => {
			expect(focus.put(10, 'foo')).toBe('10')
		})
	})
})
