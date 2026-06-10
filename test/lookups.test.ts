import { describe, expect, it, vi } from 'vitest'
import querystring from '../src/lookups/querystring.js'
import path from '../src/lookups/path.js'
import cookie from '../src/lookups/cookie.js'
import header from '../src/lookups/header.js'
import session from '../src/lookups/session.js'
import type { DetectorContext, ResolvedDetectorOptions } from '../src/types.js'

const baseOptions: ResolvedDetectorOptions = {
  order: ['querystring', 'path', 'cookie', 'header', 'session'],
  lookupQuerystring: 'lng',
  lookupParam: 'lng',
  lookupFromPathIndex: 0,
  lookupCookie: 'i18next',
  lookupSession: 'lng',
  caches: false,
}

describe('querystring lookup', () => {
  it('reads from ctx.query', () => {
    expect(querystring.lookup({ query: { lng: 'de' } }, baseOptions)).toBe('de')
  })

  it('takes the first value when the parameter repeats', () => {
    expect(querystring.lookup({ query: { lng: ['fr', 'de'] } }, baseOptions)).toBe('fr')
  })

  it('falls back to parsing ctx.url', () => {
    expect(querystring.lookup({ url: '/products?lng=es&page=2' }, baseOptions)).toBe('es')
  })

  it('returns undefined when the parameter is absent', () => {
    expect(querystring.lookup({ query: {}, url: '/products' }, baseOptions)).toBeUndefined()
  })

  it('respects a custom parameter name', () => {
    const options = { ...baseOptions, lookupQuerystring: 'locale' }
    expect(querystring.lookup({ query: { locale: 'ja' } }, options)).toBe('ja')
  })
})

describe('path lookup', () => {
  it('prefers router params', () => {
    const ctx: DetectorContext = { params: { lng: 'pt' }, path: '/de/products' }
    expect(path.lookup(ctx, baseOptions)).toBe('pt')
  })

  it('reads a path segment by index', () => {
    expect(path.lookup({ path: '/fr/products' }, baseOptions)).toBe('fr')
  })

  it('honours lookupFromPathIndex', () => {
    const options = { ...baseOptions, lookupFromPathIndex: 1 }
    expect(path.lookup({ path: '/products/it/list' }, options)).toBe('it')
  })

  it('returns undefined when the path has too few segments', () => {
    const options = { ...baseOptions, lookupFromPathIndex: 2 }
    expect(path.lookup({ path: '/products' }, options)).toBeUndefined()
  })
})

describe('cookie lookup', () => {
  it('reads via ctx.cookies', () => {
    const ctx: DetectorContext = {
      cookies: { get: (name) => (name === 'i18next' ? 'zh' : undefined), set: vi.fn() },
    }
    expect(cookie.lookup(ctx, baseOptions)).toBe('zh')
  })

  it('falls back to parsing the cookie header', () => {
    const ctx: DetectorContext = { headers: { cookie: 'a=1; i18next=ko; b=2' } }
    expect(cookie.lookup(ctx, baseOptions)).toBe('ko')
  })

  it('decodes quoted and encoded values', () => {
    const ctx: DetectorContext = { headers: { cookie: 'i18next="zh%2DHans"' } }
    expect(cookie.lookup(ctx, baseOptions)).toBe('zh-Hans')
  })

  it('writes the language with sane defaults on cacheUserLanguage', () => {
    const set = vi.fn()
    const ctx: DetectorContext = { cookies: { get: () => undefined, set } }
    cookie.cacheUserLanguage?.(ctx, 'de', baseOptions)

    expect(set).toHaveBeenCalledTimes(1)
    const [name, value, attrs] = set.mock.calls[0]!
    expect(name).toBe('i18next')
    expect(value).toBe('de')
    expect(attrs.httpOnly).toBe(false)
    expect(attrs.expires.getTime()).toBeGreaterThan(Date.now())
  })

  it('passes through cookie attributes', () => {
    const set = vi.fn()
    const ctx: DetectorContext = { cookies: { get: () => undefined, set } }
    const expires = new Date('2030-01-01')
    cookie.cacheUserLanguage?.(ctx, 'de', {
      ...baseOptions,
      cookieExpirationDate: expires,
      cookieDomain: 'example.com',
      cookiePath: '/app',
      cookieSecure: true,
      cookieSameSite: 'lax',
      cookieHttpOnly: true,
    })

    expect(set).toHaveBeenCalledWith('i18next', 'de', {
      expires,
      domain: 'example.com',
      path: '/app',
      sameSite: 'lax',
      secure: true,
      httpOnly: true,
    })
  })
})

describe('header lookup', () => {
  it('parses accept-language ordered by q value', () => {
    const ctx: DetectorContext = {
      headers: { 'accept-language': 'en-GB;q=0.8,de;q=0.9,fr;q=0.7' },
    }
    expect(header.lookup(ctx, baseOptions)).toEqual(['de', 'en-GB', 'fr'])
  })

  it('defaults q to 1', () => {
    const ctx: DetectorContext = { headers: { 'accept-language': 'ja,en;q=0.5' } }
    expect(header.lookup(ctx, baseOptions)).toEqual(['ja', 'en'])
  })

  it('ignores wildcard entries', () => {
    const ctx: DetectorContext = { headers: { 'accept-language': '*' } }
    expect(header.lookup(ctx, baseOptions)).toBeUndefined()
  })

  it('returns undefined without the header', () => {
    expect(header.lookup({ headers: {} }, baseOptions)).toBeUndefined()
    expect(header.lookup({}, baseOptions)).toBeUndefined()
  })
})

describe('session lookup', () => {
  it('reads from ctx.session', () => {
    expect(session.lookup({ session: { lng: 'es' } }, baseOptions)).toBe('es')
  })

  it('ignores non-string session values', () => {
    expect(session.lookup({ session: { lng: 42 } }, baseOptions)).toBeUndefined()
  })

  it('writes to ctx.session on cacheUserLanguage', () => {
    const ctx: DetectorContext = { session: {} }
    session.cacheUserLanguage?.(ctx, 'fr', baseOptions)
    expect(ctx.session?.lng).toBe('fr')
  })

  it('does nothing without a session', () => {
    const ctx: DetectorContext = {}
    session.cacheUserLanguage?.(ctx, 'fr', baseOptions)
    expect(ctx.session).toBeUndefined()
  })
})
