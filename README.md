<big><h1 align="center">koa-i18next-detector</h1></big>

<p align="center">
  <a href="https://npmjs.org/package/koa-i18next-detector">
    <img src="https://img.shields.io/npm/v/koa-i18next-detector.svg?style=flat-square"
         alt="NPM Version">
  </a>

  <a href="https://coveralls.io/r/lxzxl/koa-i18next-detector">
    <img src="https://img.shields.io/coveralls/lxzxl/koa-i18next-detector.svg?style=flat-square"
         alt="Coverage Status">
  </a>

  <a href="https://travis-ci.org/lxzxl/koa-i18next-detector">
    <img src="https://img.shields.io/travis/lxzxl/koa-i18next-detector.svg?style=flat-square"
         alt="Build Status">
  </a>

  <a href="https://npmjs.org/package/koa-i18next-detector">
    <img src="http://img.shields.io/npm/dm/koa-i18next-detector.svg?style=flat-square"
         alt="Downloads">
  </a>

  <a href="https://david-dm.org/lxzxl/koa-i18next-detector.svg">
    <img src="https://david-dm.org/lxzxl/koa-i18next-detector.svg?style=flat-square"
         alt="Dependency Status">
  </a>

  <a href="https://github.com/lxzxl/koa-i18next-detector/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/koa-i18next-detector.svg?style=flat-square"
         alt="License">
  </a>
</p>

<p align="center"><big>
A i18next language detecting plugin for Koa 2.0 framework.
</big></p>


## Install

```sh
npm i -S koa-i18next-detector
```

## Usage

```js
const i18next = require('i18next');
import koaI18nextDetector from "koa-i18next-detector";

// add custom detector.
lngDetector.addDetector({
    name: 'mySessionDetector',

    lookup(ctx, options) {
        let found;
        if (options.lookupSession && ctx && ctx.sessions) {
            found = ctx.sessions[options.lookupMySession];
        }
        return found;
    },

    cacheUserLanguage(ctx, lng, options = {}) {
        if (options.lookupMySession && ctx && ctx.session) {
            ctx.session[options.lookupMySession] = lng;
        }
    }
});

i18next.use(i18m.LanguageDetector).init({
    fallbackLng: 'en',
    preload: ['en', 'es'],
    resources: {
        en: {
            translation: {
                "key": "hello world"
            }
        },
        es: {
            translation: {
                "key": "es hello world es"
            }
        }
    },
    detection: {
        order: ['querystring', 'path', /*'cookie', 'header',*/ 'session', 'mySessionDetector'],

        lookupQuerystring: 'lng',

        lookupParam: 'lng', // for route like: 'path1/:lng/result'
        lookupFromPathIndex: 0,

        // currently using ctx.cookies
        lookupCookie: 'i18next',
        // cookieExpirationDate: new Date(), // default: +1 year
        // cookieDomain: '', // default: current domain.

        // currently using ctx.session
        lookupSession: 'lng',

        // other options
        lookupMySession: 'lang',

        // cache user language
        caches: ['cookie', 'mySessionDetector']
    }
}, (err, t) => {
    // initialized and ready to go!
    const hw = i18next.t('key'); // hw = 'hello world'
    console.log(hw);
});

app.use(i18m.getHandler(i18next, { locals: 'locals' }));

```

## License

MIT © [lxzxl](http://github.com/lxzxl)

[npm-url]: https://npmjs.org/package/koa-i18next-detector
[npm-image]: https://img.shields.io/npm/v/koa-i18next-detector.svg?style=flat-square

[travis-url]: https://travis-ci.org/lxzxl/koa-i18next-detector
[travis-image]: https://img.shields.io/travis/lxzxl/koa-i18next-detector.svg?style=flat-square

[coveralls-url]: https://coveralls.io/r/lxzxl/koa-i18next-detector
[coveralls-image]: https://img.shields.io/coveralls/lxzxl/koa-i18next-detector.svg?style=flat-square

[depstat-url]: https://david-dm.org/lxzxl/koa-i18next-detector
[depstat-image]: https://david-dm.org/lxzxl/koa-i18next-detector.svg?style=flat-square

[download-badge]: http://img.shields.io/npm/dm/koa-i18next-detector.svg?style=flat-square
