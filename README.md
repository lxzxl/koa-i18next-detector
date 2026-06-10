<h1 align="center">koa-i18next-detector</h1>

<p align="center">
  <a href="https://npmjs.org/package/koa-i18next-detector">
    <img src="https://img.shields.io/npm/v/koa-i18next-detector.svg?style=flat-square"
         alt="NPM Version">
  </a>
  <a href="https://github.com/lxzxl/koa-i18next-detector/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/lxzxl/koa-i18next-detector/ci.yml?style=flat-square"
         alt="Build Status">
  </a>
  <a href="https://npmjs.org/package/koa-i18next-detector">
    <img src="https://img.shields.io/npm/dm/koa-i18next-detector.svg?style=flat-square"
         alt="Downloads">
  </a>
  <a href="https://github.com/lxzxl/koa-i18next-detector/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/koa-i18next-detector.svg?style=flat-square"
         alt="License">
  </a>
</p>

<p align="center"><big>
An i18next language detection plugin for Koa 2 and Koa 3.
</big></p>

Detects the request language from the querystring, URL path, cookie,
`Accept-Language` header, or session — and can persist it back to a cookie or
session. Zero runtime dependencies, ships ESM + CJS with TypeScript types.

## Install

```sh
npm i koa-i18next-detector
# or
pnpm add koa-i18next-detector
```

Requires Node.js >= 18. Compatible with i18next v19.6+ (tested against v26)
and Koa 2/3.

## Usage

```ts
import i18next from 'i18next'
import LanguageDetector from 'koa-i18next-detector'
// CJS: const { LanguageDetector } = require('koa-i18next-detector')

await i18next.use(LanguageDetector).init({
  fallbackLng: 'en',
  supportedLngs: ['en', 'es'],
  resources: {
    en: { translation: { key: 'hello world' } },
    es: { translation: { key: 'hola mundo' } },
  },
  detection: {
    // all options are optional; these are the defaults
    order: ['querystring', 'path', 'cookie', 'header', 'session'],

    lookupQuerystring: 'lng',

    lookupParam: 'lng', // for routes like '/:lng/result'
    lookupFromPathIndex: 0,

    lookupCookie: 'i18next',
    // cookieExpirationDate: new Date(), // default: now + 1 year
    // cookieDomain: '',
    // cookiePath: '/',
    // cookieSecure: true,
    // cookieSameSite: 'lax',
    // cookieHttpOnly: false,

    lookupSession: 'lng',

    // persist the detected language, e.g. ['cookie', 'session']
    caches: false,

    // convert detected codes, e.g. 'Iso15897' turns 'en-US' into 'en_US',
    // or pass a function: (lng) => lng.toLowerCase()
    // convertDetectedLanguage: 'Iso15897',
  },
})

// inside a Koa middleware:
const lng = i18next.services.languageDetector.detect(ctx)
i18next.services.languageDetector.cacheUserLanguage(ctx, lng)
```

Pair it with [koa-i18next-middleware](https://github.com/lxzxl/koa-i18next-middleware),
which wires `detect`/`cacheUserLanguage` into the request lifecycle for you.

### Custom detectors

```ts
import { LanguageDetector } from 'koa-i18next-detector'

const lngDetector = new LanguageDetector()
lngDetector.addDetector({
  name: 'mySessionDetector',

  lookup(ctx, options) {
    return ctx.session?.[options.lookupMySession]
  },

  cacheUserLanguage(ctx, lng, options) {
    if (ctx.session) ctx.session[options.lookupMySession] = lng
  },
})

i18next.use(lngDetector).init({
  detection: {
    order: ['mySessionDetector', 'querystring'],
    lookupMySession: 'lang',
    caches: ['mySessionDetector'],
  },
})
```

### Built-in lookups

| Name          | Source                                             | Can cache |
| ------------- | -------------------------------------------------- | --------- |
| `querystring` | `ctx.query[lookupQuerystring]`                     | –         |
| `path`        | `ctx.params[lookupParam]` or path segment by index | –         |
| `cookie`      | `ctx.cookies.get(lookupCookie)`                    | ✓         |
| `header`      | `Accept-Language` (ordered by `q` value)           | –         |
| `session`     | `ctx.session[lookupSession]`                       | ✓         |

Detection stops at the first lookup that yields a language i18next reports as
supported (`supportedLngs`); otherwise `fallbackLng` is used. Detected values
are screened against common XSS payloads before being passed to i18next.

## Migrating from 0.x

- Dual ESM/CJS package with TypeScript types. With `require`, use
  `const { LanguageDetector } = require('koa-i18next-detector')`.
- Requires Node.js >= 18 and i18next >= 19.6 (the removed
  `isWhitelisted` API is no longer used).
- The `cookies` package dependency was dropped; non-Koa contexts now fall back
  to parsing the `Cookie` header directly.
- New options: `cookiePath`, `cookieSecure`, `cookieSameSite`,
  `cookieHttpOnly`, `convertDetectedLanguage`.
- `addDetector` now throws a `TypeError` for detectors without a `name` or
  `lookup` and returns the detector instance for chaining.
- Wildcard (`*`) entries in `Accept-Language` are ignored.

## License

MIT © [lxzxl](https://github.com/lxzxl)
