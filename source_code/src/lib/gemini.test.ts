import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { importResume, parseJson } from './gemini'
import { useSettings } from '../store/settings'
import { emptyResume } from '../data/sample'

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

function mockGeminiResponse(body: unknown) {
  return vi.fn(async () =>
    new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(body) }] } }] }),
      { status: 200 },
    ),
  )
}

describe('importResume', () => {
  const settingsBefore = useSettings.getState()

  beforeEach(() => {
    useSettings.setState({ apiKey: 'test-api-key', model: 'gemini-2.5-flash' })
  })

  afterEach(() => {
    useSettings.setState(settingsBefore)
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('sends the extracted text and no-invention instructions in the prompt', async () => {
    const fetchMock = mockGeminiResponse({ ...emptyResume(), basics: { ...emptyResume().basics, fullName: 'Jane Doe' } })
    vi.stubGlobal('fetch', fetchMock)

    await importResume('Jane Doe\nSenior Engineer\njane@example.com')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    const prompt: string = body.contents[0].parts[0].text
    expect(prompt).toContain('Jane Doe\nSenior Engineer\njane@example.com')
    expect(prompt).toContain('Never invent facts')
  })

  it('authenticates with the x-goog-api-key header, not a ?key= query param', async () => {
    const fetchMock = mockGeminiResponse(emptyResume())
    vi.stubGlobal('fetch', fetchMock)

    await importResume('some resume text')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).not.toContain('key=')
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-api-key')
  })

  it('repairs a response missing item ids into a valid ResumeData', async () => {
    const fetchMock = mockGeminiResponse({
      basics: { fullName: 'Jane Doe' },
      experience: [{ company: 'Acme', position: 'Engineer', highlights: ['Did things'] }],
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await importResume('resume text')
    expect(result.basics.fullName).toBe('Jane Doe')
    expect(result.experience).toHaveLength(1)
    expect(typeof result.experience[0].id).toBe('string')
    expect(result.experience[0].id.length).toBeGreaterThan(0)
  })

  it('throws a specific error when the response has a wrong-typed field', async () => {
    const fetchMock = mockGeminiResponse({ basics: { fullName: 'Jane Doe' }, skills: 'not an array' })
    vi.stubGlobal('fetch', fetchMock)

    await expect(importResume('resume text')).rejects.toThrow(/Invalid "skills"/)
  })

  it('throws a descriptive error when the model returns unparseable text', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: 'not json at all' }] } }] }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(importResume('resume text')).rejects.toThrow(
      'Gemini returned a response that could not be parsed. Try again.',
    )
  })

  it('routes missing-key state to MissingKeyError without calling fetch', async () => {
    useSettings.setState({ apiKey: '' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(importResume('resume text')).rejects.toThrow(
      'Add your Gemini API key in Settings to use AI features.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
