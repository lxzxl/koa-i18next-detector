import type { LanguageLookup } from '../types.js'

const sessionLookup: LanguageLookup = {
  name: 'session',

  lookup(ctx, options) {
    if (!options.lookupSession) return undefined
    const found = ctx.session?.[options.lookupSession]
    return typeof found === 'string' ? found : undefined
  },

  cacheUserLanguage(ctx, lng, options) {
    if (options.lookupSession && ctx.session) {
      ctx.session[options.lookupSession] = lng
    }
  },
}

export default sessionLookup
