# Changelog

## v1.0.0 (2026-06-10)

Modernization release — full rewrite in TypeScript.

### Breaking

- Requires Node.js >= 18 and i18next >= 19.6 (drops the removed `isWhitelisted` API in favour of `isSupportedCode`).
- Dual ESM/CJS package built with [tsdown](https://tsdown.dev) (rolldown). With `require`, use `const { LanguageDetector } = require('koa-i18next-detector')`.
- Wildcard (`*`) entries in `Accept-Language` are ignored instead of being passed to i18next.
- `addDetector` throws a `TypeError` for detectors without a `name`/`lookup` (previously logged to console).

### Added

- TypeScript types for all options, contexts, and custom detectors.
- Cookie attributes: `cookiePath`, `cookieSecure`, `cookieSameSite`, `cookieHttpOnly`.
- `convertDetectedLanguage` option (`'Iso15897'` or a custom function), matching i18next-http-middleware.
- Detected values are screened against common XSS payloads.
- Test suite (vitest), including integration tests against i18next v26.

### Removed

- The `cookies` runtime dependency — the package now has zero runtime dependencies.

## v0.x

See git history.
