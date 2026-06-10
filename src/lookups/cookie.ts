import type { LanguageLookup } from '../types.js'

function parseCookieHeader(header: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const pair of header.split(';')) {
    const index = pair.indexOf('=')
    if (index < 0) continue
    const name = pair.slice(0, index).trim()
    if (!name || name in result) continue
    let value = pair.slice(index + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    try {
      result[name] = decodeURIComponent(value)
    } catch {
      result[name] = value
    }
  }
  return result
}

const cookieLookup: LanguageLookup = {
  name: 'cookie',

  lookup(ctx, options) {
    if (!options.lookupCookie) return undefined

    if (ctx.cookies?.get) {
      return ctx.cookies.get(options.lookupCookie) ?? undefined
    }

    // Fall back to parsing the raw header for non-Koa contexts.
    const header = ctx.headers?.cookie
    if (typeof header === 'string') {
      return parseCookieHeader(header)[options.lookupCookie]
    }

    return undefined
  },

  cacheUserLanguage(ctx, lng, options) {
    if (!options.lookupCookie || !ctx.cookies?.set) return

    let expires = options.cookieExpirationDate
    if (!expires) {
      expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)
    }

    ctx.cookies.set(options.lookupCookie, lng, {
      expires,
      domain: options.cookieDomain,
      path: options.cookiePath,
      sameSite: options.cookieSameSite,
      secure: options.cookieSecure,
      httpOnly: options.cookieHttpOnly ?? false,
    })
  },
}

export default cookieLookup
