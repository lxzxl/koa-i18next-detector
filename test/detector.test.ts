import { describe, expect, it, vi } from 'vitest'
import LanguageDetector from '../src/index.js'
import type { DetectorContext, I18nextServices } from '../src/types.js'

function stubServices(supported?: string[]): I18nextServices {
  return {
    languageUtils: {
      formatLanguageCode: (code: string) => code,
      isSupportedCode: (code: string) => !supported || supported.includes(code),
      getFallbackCodes: (fallbacks: unknown) =>
        typeof fallbacks === 'string' ? [fallbacks] : ((fallbacks as string[]) ?? []),
    },
  }
}

describe('LanguageDetector', () => {
  it('exposes the i18next module type', () => {
    expect(LanguageDetector.type).toBe('languageDetector')
    expect(new LanguageDetector().type).toBe('languageDetector')
  })

  it('detects following the configured order', () => {
    const detector = new LanguageDetector(stubServices(), { order: ['cookie', 'querystring'] })
    const ctx: DetectorContext = {
      query: { lng: 'de' },
      cookies: { get: () => 'fr', set: vi.fn() },
    }
    expect(detector.detect(ctx)).toBe('fr')
    expect(ctx.i18nextLookupName).toBe('cookie')
  })

  it('skips unsupported languages and keeps searching', () => {
    const detector = new LanguageDetector(stubServices(['en', 'es']), {
      order: ['querystring', 'header'],
    })
    const ctx: DetectorContext = {
      query: { lng: 'de' },
      headers: { 'accept-language': 'fr,es;q=0.8' },
    }
    expect(detector.detect(ctx)).toBe('es')
    expect(ctx.i18nextLookupName).toBe('header')
  })

  it('falls back to fallbackLng when nothing matches', () => {
    const detector = new LanguageDetector(stubServices(['en']), {}, { fallbackLng: ['en'] })
    expect(detector.detect({ query: { lng: 'xx' } })).toBe('en')
  })

  it('handles string fallbackLng', () => {
    const detector = new LanguageDetector(stubServices(['en']), {}, { fallbackLng: 'en' })
    expect(detector.detect({})).toBe('en')
  })

  it('returns undefined without ctx', () => {
    const detector = new LanguageDetector(stubServices())
    expect(detector.detect()).toBeUndefined()
  })

  it('works standalone without i18next services', () => {
    const detector = new LanguageDetector()
    expect(detector.detect({ query: { lng: 'de' } })).toBe('de')
  })

  it('allows overriding the order per call', () => {
    const detector = new LanguageDetector(stubServices())
    const ctx: DetectorContext = {
      query: { lng: 'de' },
      session: { lng: 'ja' },
    }
    expect(detector.detect(ctx, ['session'])).toBe('ja')
  })

  it('filters XSS payloads out of detections', () => {
    const detector = new LanguageDetector(stubServices(), {}, { fallbackLng: 'en' })
    const ctx: DetectorContext = { query: { lng: '<script>alert(1)</script>' } }
    expect(detector.detect(ctx)).toBe('en')
    expect(ctx.i18nextLookupName).toBeUndefined()
  })

  it('applies convertDetectedLanguage', () => {
    const iso = new LanguageDetector(stubServices(), { convertDetectedLanguage: 'Iso15897' })
    expect(iso.detect({ query: { lng: 'en-US' } })).toBe('en_US')

    const custom = new LanguageDetector(stubServices(), {
      convertDetectedLanguage: (lng) => lng.toUpperCase(),
    })
    expect(custom.detect({ query: { lng: 'de' } })).toBe('DE')
  })

  it('supports custom detectors', () => {
    const detector = new LanguageDetector(stubServices(), { order: ['mySession'] })
    detector.addDetector({
      name: 'mySession',
      lookup: (ctx) => (ctx.session?.lang as string | undefined) ?? undefined,
      cacheUserLanguage: (ctx, lng) => {
        if (ctx.session) ctx.session.lang = lng
      },
    })

    const ctx: DetectorContext = { session: { lang: 'ko' } }
    expect(detector.detect(ctx)).toBe('ko')

    detector.cacheUserLanguage(ctx, 'ja', ['mySession'])
    expect(ctx.session?.lang).toBe('ja')
  })

  it('rejects invalid detectors', () => {
    const detector = new LanguageDetector()
    // @ts-expect-error - intentionally invalid
    expect(() => detector.addDetector({ name: 'broken' })).toThrow(TypeError)
  })

  it('caches only to configured targets', () => {
    const detector = new LanguageDetector(stubServices(), { caches: ['cookie'] })
    const set = vi.fn()
    const ctx: DetectorContext = {
      cookies: { get: () => undefined, set },
      session: {},
    }

    detector.cacheUserLanguage(ctx, 'de')
    expect(set).toHaveBeenCalledTimes(1)
    expect(ctx.session).toEqual({})
  })

  it('does not cache when caches is false', () => {
    const detector = new LanguageDetector(stubServices())
    const set = vi.fn()
    detector.cacheUserLanguage({ cookies: { get: () => undefined, set } }, 'de')
    expect(set).not.toHaveBeenCalled()
  })

  it('allows overriding caches per call', () => {
    const detector = new LanguageDetector(stubServices(), { caches: false })
    const ctx: DetectorContext = { session: {} }
    detector.cacheUserLanguage(ctx, 'es', ['session'])
    expect(ctx.session?.lng).toBe('es')
  })
})
