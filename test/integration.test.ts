import { createInstance } from 'i18next'
import { beforeAll, describe, expect, it } from 'vitest'
import LanguageDetector from '../src/index.js'
import type { DetectorContext } from '../src/types.js'

// End-to-end against a real i18next instance: validates that the detector
// still speaks the current i18next services API (v26).
describe('integration with i18next', () => {
  const i18next = createInstance()

  beforeAll(async () => {
    await i18next.use(LanguageDetector).init({
      fallbackLng: 'en',
      cleanCode: true,
      supportedLngs: ['en', 'es', 'zh'],
      resources: {
        en: { translation: { key: 'hello world' } },
        es: { translation: { key: 'hola mundo' } },
        zh: { translation: { key: '你好世界' } },
      },
      detection: {
        order: ['querystring', 'cookie', 'header'],
        caches: ['cookie'],
      },
    })
  })

  function detect(ctx: DetectorContext) {
    return (i18next.services as { languageDetector?: LanguageDetector }).languageDetector?.detect(
      ctx
    )
  }

  it('registers as the languageDetector service', () => {
    expect(
      (i18next.services as { languageDetector?: LanguageDetector }).languageDetector
    ).toBeInstanceOf(LanguageDetector)
  })

  it('detects a supported language from the querystring', () => {
    expect(detect({ query: { lng: 'es' } })).toBe('es')
  })

  it('normalises language codes via i18next languageUtils', () => {
    expect(detect({ query: { lng: 'ES' } })).toBe('es')
  })

  it('resolves regional variants from accept-language', () => {
    const ctx: DetectorContext = {
      headers: { 'accept-language': 'zh-CN;q=0.9,en;q=0.8' },
    }
    // zh-CN itself is not in supportedLngs; with nonExplicitSupportedLngs off
    // the next supported entry (en) wins.
    expect(detect(ctx)).toBe('en')
  })

  it('falls back to fallbackLng for unsupported languages', () => {
    expect(detect({ query: { lng: 'xx' } })).toBe('en')
  })

  it('translates after changeLanguage with a detected language', async () => {
    const lng = detect({ query: { lng: 'zh' } })
    await i18next.changeLanguage(lng)
    expect(i18next.t('key')).toBe('你好世界')
  })

  it('caches the detected language through cacheUserLanguage', () => {
    const writes: Array<[string, string | null]> = []
    const ctx: DetectorContext = {
      cookies: {
        get: () => undefined,
        set: (name, value) => writes.push([name, value]),
      },
    }
    ;(
      i18next.services as { languageDetector?: LanguageDetector }
    ).languageDetector?.cacheUserLanguage(ctx, 'es')
    expect(writes).toEqual([['i18next', 'es']])
  })
})
