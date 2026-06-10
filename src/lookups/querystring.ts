import type { LanguageLookup } from '../types.js'

const querystringLookup: LanguageLookup = {
  name: 'querystring',

  lookup(ctx, options) {
    if (!options.lookupQuerystring) return undefined

    const fromQuery = ctx.query?.[options.lookupQuerystring]
    if (fromQuery) return Array.isArray(fromQuery) ? fromQuery[0] : fromQuery

    // Fall back to parsing the raw URL for non-Koa contexts.
    if (typeof ctx.url === 'string') {
      try {
        const url = new URL(ctx.url, 'http://localhost')
        return url.searchParams.get(options.lookupQuerystring) ?? undefined
      } catch {
        return undefined
      }
    }

    return undefined
  },
}

export default querystringLookup
