import { at } from '.'
import { flow } from '../flow'
import { eq } from './core'

describe('at', () => {
	type Source = string[]
	const sourceDefined: Source = ['foo', 'bar', 'baz', 'quux']
	const sourceUndefined: Source = ['foo']
	const cb = (x: string) => `${x} UPDATED`
	const focus = flow(eq<Source>(), at(1))

	it('view undefined', () => {
		expect(focus.view(sourceUndefined)).toBeUndefined()
	})
	it('view defined', () => {
		expect(focus.view(sourceDefined)).toBe('bar')
	})
	it('put undefined', () => {
		expect(focus.put('UPDATED', sourceUndefined)).toEqual(sourceUndefined)
	})
	it('put defined', () => {
		expect(focus.put('UPDATED', sourceDefined)).toEqual([
			'foo',
			'UPDATED',
			'baz',
			'quux',
		])
	})
	it('modify undefined', () => {
		expect(focus.modify(cb, sourceUndefined)).toEqual(sourceUndefined)
	})
	it('modify defined', () => {
		expect(focus.modify(cb, sourceDefined)).toEqual([
			'foo',
			'bar UPDATED',
			'baz',
			'quux',
		])
	})
})
