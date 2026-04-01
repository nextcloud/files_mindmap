import { describe, it, expect } from 'vitest'
import util from '../util.js'

describe('util.jsVar', () => {
	it('replaces hyphens with underscores', () => {
		expect(util.jsVar('foo-bar-baz')).toBe('foo_bar_baz')
	})

	it('returns empty string for null', () => {
		expect(util.jsVar(null)).toBe('')
	})

	it('returns empty string for undefined', () => {
		expect(util.jsVar(undefined)).toBe('')
	})

	it('leaves strings without hyphens unchanged', () => {
		expect(util.jsVar('foobar')).toBe('foobar')
	})
})

describe('util.toArray', () => {
	it('wraps a non-array value in an array', () => {
		expect(util.toArray('foo')).toEqual(['foo'])
		expect(util.toArray(42)).toEqual([42])
	})

	it('wraps an object in an array', () => {
		const obj = { a: 1 }
		expect(util.toArray(obj)).toEqual([obj])
	})

	it('returns arrays unchanged', () => {
		expect(util.toArray([1, 2, 3])).toEqual([1, 2, 3])
	})

	it('returns empty arrays unchanged', () => {
		expect(util.toArray([])).toEqual([])
	})
})

describe('util.base64Encode / util.base64Decode', () => {
	it('round-trips ASCII text', () => {
		const text = 'Hello, World!'
		expect(util.base64Decode(util.base64Encode(text))).toBe(text)
	})

	it('round-trips unicode text', () => {
		const text = 'Héllo Wörld — こんにちは'
		expect(util.base64Decode(util.base64Encode(text))).toBe(text)
	})

	it('base64Encode returns a non-empty string', () => {
		expect(util.base64Encode('test')).toBeTruthy()
	})

	it('base64Decode handles plain btoa-encoded ASCII', () => {
		expect(util.base64Decode(btoa('hello'))).toBe('hello')
	})
})

describe('util.xml2json', () => {
	it('parses element attributes', () => {
		const xml = '<root id="42" name="test" />'
		const result = util.xml2json(xml)
		expect(result.id).toBe('42')
		expect(result.name).toBe('test')
	})

	it('parses nested child elements', () => {
		const xml = '<root><child TEXT="hello" /></root>'
		const result = util.xml2json(xml)
		expect(result.child).toBeDefined()
		expect(result.child.TEXT).toBe('hello')
	})

	it('parses multiple children of the same tag as an array', () => {
		const xml = '<root><node TEXT="a"/><node TEXT="b"/></root>'
		const result = util.xml2json(xml)
		expect(Array.isArray(result.node)).toBe(true)
		expect(result.node).toHaveLength(2)
	})

	it('returns defined result for a minimal document', () => {
		const xml = '<map version="1.0"><node TEXT="Root"/></map>'
		const result = util.xml2json(xml)
		expect(result).toBeDefined()
	})
})
