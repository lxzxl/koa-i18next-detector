import type { LanguageLookup } from '../types.js'

const headerLookup: LanguageLookup = {
  name: 'header',

  lookup(ctx) {
    const acceptLanguage = ctx.headers?.['accept-language']
    if (typeof acceptLanguage !== 'string' || !acceptLanguage) return undefined

    // Associate language tags with their 'q' value, e.g. 'en-GB;q=0.8'.
    const weighted = acceptLanguage.split(',').map((entry) => {
      const [tag = '', ...params] = entry.trim().split(';')
      let q = 1
      for (const param of params) {
        const [key, value] = param.trim().split('=')
        if (key === 'q' && value !== undefined && !Number.isNaN(Number(value))) {
          q = Number(value)
          break
        }
      }
      return { lng: tag.trim(), q }
    })

    const locales = weighted
      .filter((entry) => entry.lng && entry.lng !== '*')
      .sort((a, b) => b.q - a.q)
      .map((entry) => entry.lng)

    return locales.length ? locales : undefined
  },
}

export default headerLookup
