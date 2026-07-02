import { describe, expect, it } from 'vitest'
import { parseJson } from './gemini'

describe('parseJson', () => {
  it('parses clean JSON', () => {
    expect(parseJson('{"a":1}')).toEqual({ a: 1 })
  })

  it('parses JSON wrapped in a ```json fence', () => {
    const text = '```json\n{"a":1}\n```'
    expect(parseJson(text)).toEqual({ a: 1 })
  })

  it('parses JSON wrapped in a plain ``` fence', () => {
    const text = '```\n{"a":1}\n```'
    expect(parseJson(text)).toEqual({ a: 1 })
  })

  it('extracts JSON embedded in surrounding prose', () => {
    const text = 'Sure, here is the result: {"a":1} — hope that helps!'
    expect(parseJson(text)).toEqual({ a: 1 })
  })

  it('throws a descriptive error when no JSON can be found', () => {
    expect(() => parseJson('not json at all, no braces here')).toThrow(
      'Gemini returned a response that could not be parsed. Try again.',
    )
  })
})
