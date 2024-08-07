// https://github.com/nodeshapes/js-optics-benchmark
import { flow } from '@/utils'
import { Lens } from 'monocle-ts'
import * as O from 'optics-ts'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line
import * as L from 'partial.lenses'
import { bench } from 'vitest'

import { prop } from '.'
import { eq } from './core'

const data = { a: { b: { c: { d: { e: 'hello' } } } } }
type Data = typeof data

describe('read', () => {
	;(() => {
		const focus = flow(
			eq<Data>(),
			prop('a'),
			prop('b'),
			prop('c'),
			prop('d'),
			prop('e'),
		)
		const fn = () => focus.view(data)
		bench('composer', fn as () => void)
		expect(fn()).toBe('hello')
	})()
	;(() => {
		const focus = O.optic<Data>().path('a', 'b', 'c', 'd', 'e')
		const v = O.get(focus)
		const fn = () => v(data)
		bench('optics-ts', fn as () => void)
		expect(fn()).toBe('hello')
	})()
	;(() => {
		const optics = Lens.fromPath<Data>()(['a', 'b', 'c', 'd', 'e'])
		const fn = () => optics.get(data)
		bench('monocle-ts', fn as () => void)
		expect(fn()).toBe('hello')
	})()
	;(() => {
		const focus = L.compose(['a', 'b', 'c', 'd', 'e'])
		const fn = () => L.get(focus, data)
		bench('partial.lenses', fn as () => void)
		expect(fn()).toBe('hello')
	})()
})

describe('write', () => {
	const str = 'world,'
	;(() => {
		const focus = flow(
			eq<Data>(),
			prop('a'),
			prop('b'),
			prop('c'),
			prop('d'),
			prop('e'),
		)
		const v = focus.update(str)
		const fn = () => v(data)
		bench('composer', fn as () => void)
		expect(focus.view(fn())).toEqual(str)
	})()
	;(() => {
		const focus = O.optic<Data>().path('a', 'b', 'c', 'd', 'e')
		const v = O.set(focus)(str)
		const fn = () => v(data)
		bench('optics-ts', fn as () => void)
		expect(O.get(focus)(fn())).toEqual(str)
	})()
	;(() => {
		const focus = Lens.fromPath<Data>()(['a', 'b', 'c', 'd', 'e'])
		const v = focus.set(str)
		const fn = () => v(data)
		bench('monocle-ts', fn as () => void)
		expect(focus.get(fn())).toEqual(str)
	})()
	;(() => {
		const focus = L.compose(['a', 'b', 'c', 'd', 'e'])
		const fn = () => L.set(focus, str, data)
		bench('partial.lenses', fn as () => void)
		expect(L.get(focus, fn())).toEqual(str)
	})()
})

describe('modify', () => {
	;(() => {
		const cb = (s: string) => s.toUpperCase()
		const res = 'HELLO'
		const focus = flow(
			eq<Data>(),
			prop('a'),
			prop('b'),
			prop('c'),
			prop('d'),
			prop('e'),
		)
		const v = focus.update(cb)
		const fn = () => v(data)
		bench('composer', fn as () => void)
		expect(focus.view(fn())).toEqual(res)
	})()
	;(() => {
		const cb = (s: string) => s.toUpperCase()
		const res = 'HELLO'
		const focus = O.optic<Data>().path('a', 'b', 'c', 'd', 'e')
		const v = O.modify(focus)(cb)
		const fn = () => v(data)
		bench('optics-ts', fn as () => void)
		expect(O.get(focus)(fn())).toEqual(res)
	})()
	;(() => {
		const cb = (s: string) => s.toUpperCase()
		const res = 'HELLO'
		const focus = Lens.fromPath<Data>()(['a', 'b', 'c', 'd', 'e'])
		const v = focus.modify(cb)
		const fn = () => v(data)
		bench('monocle-ts', fn as () => void)
		expect(focus.get(fn())).toEqual(res)
	})()
	;(() => {
		const cb = (s: string) => s.toUpperCase()
		const res = 'HELLO'
		const focus = L.compose(['a', 'b', 'c', 'd', 'e'])
		const fn = () => L.modify(focus, cb, data)
		bench('partial.lenses', fn as () => void)
		expect(L.get(focus, fn())).toEqual(res)
	})()
})
