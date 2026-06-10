/**
 * Cookie attributes accepted by Koa's `ctx.cookies.set()`.
 */
export interface CookieAttributes {
  expires?: Date
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none' | boolean
}

/**
 * Minimal structural view of a Koa context. Works with both Koa 2 and Koa 3
 * without depending on Koa types at runtime.
 */
export interface DetectorContext {
  url?: string
  path?: string
  query?: Record<string, string | string[] | undefined>
  /** Populated by routers such as @koa/router. */
  params?: Record<string, string | undefined>
  headers?: Record<string, string | string[] | undefined>
  cookies?: {
    get(name: string): string | undefined
    set(name: string, value: string | null, opts?: CookieAttributes): unknown
  }
  session?: Record<string, unknown> | null
  /** Set by the detector: name of the lookup that produced the detected language. */
  i18nextLookupName?: string
  [key: string]: unknown
}

export interface DetectorOptions {
  /** Lookup order. Default: ['querystring', 'path', 'cookie', 'header', 'session'] */
  order?: string[]

  /** Query parameter to look up. Default: 'lng' */
  lookupQuerystring?: string

  /** Router param to look up (e.g. route '/:lng/result'). Default: 'lng' */
  lookupParam?: string
  /** Index of the path segment to look up. Default: 0 */
  lookupFromPathIndex?: number

  /** Cookie name to look up. Default: 'i18next' */
  lookupCookie?: string
  /** Default: now + 1 year */
  cookieExpirationDate?: Date
  cookieDomain?: string
  cookiePath?: string
  cookieSecure?: boolean
  cookieSameSite?: 'strict' | 'lax' | 'none' | boolean
  /** Default: false, so client-side scripts can read the language. */
  cookieHttpOnly?: boolean

  /** Session key to look up. Default: 'lng' */
  lookupSession?: string

  /** Lookup names to persist the detected language to, e.g. ['cookie']. Default: false */
  caches?: string[] | false

  /** Convert detected codes, e.g. 'Iso15897' turns 'en-US' into 'en_US'. */
  convertDetectedLanguage?: 'Iso15897' | ((lng: string) => string)
}

export type ResolvedDetectorOptions = DetectorOptions &
  Required<
    Pick<
      DetectorOptions,
      | 'order'
      | 'lookupQuerystring'
      | 'lookupParam'
      | 'lookupFromPathIndex'
      | 'lookupCookie'
      | 'lookupSession'
      | 'caches'
    >
  >

/**
 * A pluggable lookup. Register with `LanguageDetector#addDetector`.
 */
export interface LanguageLookup {
  name: string
  lookup(
    ctx: DetectorContext,
    options: ResolvedDetectorOptions
  ): string | string[] | undefined | null
  cacheUserLanguage?(ctx: DetectorContext, lng: string, options: ResolvedDetectorOptions): void
}

/**
 * The slice of i18next services the detector relies on. All methods exist on
 * i18next >= 19.5; they are probed defensively so the detector also works
 * standalone (without i18next).
 */
export interface I18nextServices {
  languageUtils?: {
    formatLanguageCode?(code: string): string
    isSupportedCode?(code: string): boolean
    getFallbackCodes?(fallbacks: unknown, code?: string): string[]
  }
  [key: string]: unknown
}

/** The i18next init options the detector reads (`fallbackLng`). */
export interface I18nextOptions {
  fallbackLng?: unknown
  [key: string]: unknown
}
