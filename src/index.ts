import querystringLookup from './lookups/querystring.js'
import pathLookup from './lookups/path.js'
import cookieLookup from './lookups/cookie.js'
import headerLookup from './lookups/header.js'
import sessionLookup from './lookups/session.js'
import { hasXSS } from './utils.js'
import type {
  DetectorContext,
  DetectorOptions,
  I18nextOptions,
  I18nextServices,
  LanguageLookup,
  ResolvedDetectorOptions,
} from './types.js'

function getDefaults(): ResolvedDetectorOptions {
  return {
    order: ['querystring', 'path', 'cookie', 'header', 'session'],

    lookupQuerystring: 'lng',

    lookupParam: 'lng', // for routes like '/:lng/result'
    lookupFromPathIndex: 0,

    lookupCookie: 'i18next',

    lookupSession: 'lng',

    caches: false, // e.g. ['cookie']
  }
}

/**
 * An i18next language detection plugin for Koa.
 *
 * Usable both as an i18next module (`i18next.use(LanguageDetector)`) and
 * standalone (`new LanguageDetector().detect(ctx)`).
 */
export class LanguageDetector {
  static readonly type = 'languageDetector'

  readonly type = 'languageDetector'
  detectors: Record<string, LanguageLookup> = {}
  services: I18nextServices | undefined
  options!: ResolvedDetectorOptions
  i18nextOptions: I18nextOptions = {}

  constructor(services?: I18nextServices, options: DetectorOptions = {}, i18nextOptions: I18nextOptions = {}) {
    this.init(services, options, i18nextOptions)
  }

  init(services?: I18nextServices, options: DetectorOptions = {}, i18nextOptions: I18nextOptions = {}): void {
    this.services = services
    this.options = { ...getDefaults(), ...this.options, ...options }
    this.i18nextOptions = i18nextOptions

    this.addDetector(querystringLookup)
    this.addDetector(pathLookup)
    this.addDetector(cookieLookup)
    this.addDetector(headerLookup)
    this.addDetector(sessionLookup)
  }

  addDetector(detector: LanguageLookup): this {
    if (!detector || typeof detector.lookup !== 'function' || !detector.name) {
      throw new TypeError('detector must have a name and a lookup method')
    }
    this.detectors[detector.name] = detector
    return this
  }

  /**
   * Detect the language from a Koa context. Returns the first detection
   * (following `options.order`) that i18next reports as supported, otherwise
   * the fallback language.
   */
  detect(ctx?: DetectorContext, detectionOrder?: string[]): string | undefined {
    if (!ctx) return undefined

    const order = detectionOrder ?? this.options.order
    for (const name of order) {
      const detector = this.detectors[name]
      if (!detector?.lookup) continue

      const raw = detector.lookup(ctx, this.options)
      if (!raw) continue

      const detections = (Array.isArray(raw) ? raw : [raw])
        .filter((d): d is string => typeof d === 'string' && d.length > 0 && !hasXSS(d))
        .map((d) => this.convertDetectedLanguage(d))

      const languageUtils = this.services?.languageUtils
      for (const detection of detections) {
        const cleaned = languageUtils?.formatLanguageCode
          ? languageUtils.formatLanguageCode(detection)
          : detection
        if (!languageUtils?.isSupportedCode || languageUtils.isSupportedCode(cleaned)) {
          ctx.i18nextLookupName = name
          return cleaned
        }
      }
    }

    return this.getFallbackLng()
  }

  cacheUserLanguage(ctx?: DetectorContext, lng?: string, caches?: string[] | false): void {
    if (!ctx || !lng) return

    const targets = caches ?? this.options.caches
    if (!targets) return

    for (const name of targets) {
      this.detectors[name]?.cacheUserLanguage?.(ctx, lng, this.options)
    }
  }

  private convertDetectedLanguage(lng: string): string {
    const convert = this.options.convertDetectedLanguage
    if (typeof convert === 'function') return convert(lng)
    if (convert === 'Iso15897') return lng.replace('-', '_')
    return lng
  }

  private getFallbackLng(): string | undefined {
    const fallback = this.i18nextOptions.fallbackLng
    if (!fallback) return undefined

    const languageUtils = this.services?.languageUtils
    if (languageUtils?.getFallbackCodes) {
      return languageUtils.getFallbackCodes(fallback)[0]
    }
    if (typeof fallback === 'string') return fallback
    if (Array.isArray(fallback)) return fallback[0] as string | undefined
    if (typeof fallback === 'object') {
      const byCode = fallback as Record<string, string | string[]>
      const dflt = byCode.default
      return Array.isArray(dflt) ? dflt[0] : dflt
    }
    return undefined
  }
}

export type {
  CookieAttributes,
  DetectorContext,
  DetectorOptions,
  I18nextOptions,
  I18nextServices,
  LanguageLookup,
  ResolvedDetectorOptions,
} from './types.js'
export { hasXSS } from './utils.js'

export default LanguageDetector
