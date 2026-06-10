import type { LanguageLookup } from '../types.js'

const pathLookup: LanguageLookup = {
  name: 'path',

  lookup(ctx, options) {
    if (options.lookupParam) {
      const fromParams = ctx.params?.[options.lookupParam]
      if (fromParams) return fromParams
    }

    if (options.lookupFromPathIndex !== undefined && typeof ctx.path === 'string') {
      const parts = ctx.path.split('/').filter((p) => p !== '')
      if (parts.length > options.lookupFromPathIndex) {
        return parts[options.lookupFromPathIndex]
      }
    }

    return undefined
  },
}

export default pathLookup
