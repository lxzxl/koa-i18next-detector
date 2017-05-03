const assert = require('assert');
import querystringLookup from './lookups/querystring';
import pathLookup from './lookups/path';
import cookieLookup from './lookups/cookie';
import headerLookup from './lookups/header';
// import sessionLookup from './lookups/session';

function getDefaultsOpt() {
    return {
        order: ['querystring', 'path', 'cookie', 'header', 'session'],

        lookupQuerystring: 'lng',

        lookupParam: 'lng', // for route like: 'path1/:lng/result'
        lookupFromPathIndex: 0,

        lookupCookie: 'i18next',
        // cookieExpirationDate: new Date(),
        // cookieDomain: '',

        lookupSession: 'lng',

        // cache user language
        caches: false, //['cookie']
    };
}

function defaults(obj) {
    Array.from(arguments).slice(1).forEach(source => {
        if (source) {
            for (var prop in source) {
                if (obj[prop] === undefined) obj[prop] = source[prop];
            }
        }
    });
    return obj;
}

class LanguageDetector {
    constructor(services, options = {}, i18nextOptions = {}) {
        this.type = 'languageDetector';
        this.detectors = {};

        this.init(services, options, i18nextOptions);
    }

    init(services, options = {}, i18nextOptions = {}) {
        this.services = services;
        this.options = defaults(options, this.options || {}, getDefaultsOpt());
        this.i18nextOptions = i18nextOptions;
        try {
            this.addDetector(querystringLookup);
            this.addDetector(pathLookup);
            this.addDetector(cookieLookup);
            this.addDetector(headerLookup);
            this.addDetector(sessionLookup);
        } catch (e) {
            console.error(e.message);
        }
    }

    addDetector(detector) {
        assert.ok(detector.lookup, `detector must contains a lookup method`);
        this.detectors[detector.name] = detector;
    }

    detect(ctx) {
        if (arguments.length < 1) {
            return;
        }

        let found;
        this.options.order.forEach(detectorName => {
            if (found || !this.detectors[detectorName] || !this.detectors[detectorName].lookup) {
                return;
            }

            let detections = this.detectors[detectorName].lookup(ctx, this.options);
            if (!detections) return;
            if (typeof detections === 'string') {
                detections = [detections];
            }

            detections.forEach(lng => {
                if (found) return;

                let cleanedLng = this.services.languageUtils.formatLanguageCode(lng);

                if (this.services.languageUtils.isWhitelisted(cleanedLng)) {
                    found = cleanedLng;
                    ctx.i18nextLookupName = detectorName;
                };
            });
        });

        return found || (this.i18nextOptions.fallbackLng && this.i18nextOptions.fallbackLng[0]);
    }

    cacheUserLanguage(ctx, lng, caches) {
        if (arguments.length < 2) {
            return;
        }
        if (!caches) {
            caches = this.options.caches;
        }
        if (!caches) {
            return;
        }
        caches.forEach(cacheName => {
            let detector = this.detectors[cacheName];
            if (detector && detector.cacheUserLanguage) {
                detector.cacheUserLanguage(ctx, lng, this.options);
            }
        });
    }
}

LanguageDetector.type = 'languageDetector';

export default LanguageDetector;