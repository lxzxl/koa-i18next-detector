const assert = require('assert');
import querystringLookup from './lookups/querystring';
import pathLookup from './lookups/path';
// import cookieLookup from './languageLookups/cookie';
// import headerLookup from './languageLookups/header';
// import sessionLookup from './languageLookups/session';

function getDefaults() {
    return {
        detectors: [{
                name: 'querystring',
                lookupQuerystring: 'lng',
            },
            {
                name: 'path',
                lookupParam: 'lng', // for route like: 'path1/:lng/result'
                lookupFromPathIndex: 0
            },
            {
                name: 'cookie',
                lookupCookie: 'i18next',
            },
            {
                name: 'header',
            },
            {
                name: 'session',
                lookupSession: 'lng'
            }
        ],

        // cache user language
        caches: false,
        // ['cookie']
        //cookieExpirationDate: new Date(),
        //cookieDomain: 'myDomain'
    };
}

class LanguageDetector {
    constructor(services, options = {}, i18nextOptions = {}) {
        this.type = 'languageDetector';
        this.detectors = {};

        this.init(services, options, i18nextOptions);
    }

    init(services, options = {}, i18nextOptions = {}) {
        this.services = services;
        this.options = Object.assign({}, getDefaults(), this.options || {}, options);
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
        this.options.detectors.forEach(detectorOpt => {
            if (found || !this.detectors[detectorOpt.name]) {
                return;
            }

            let detections = this.detectors[detectorOpt.name].lookup(ctx, detectorOpt);
            if (!detections) return;
            if (typeof detections === 'string') detections = [detections];

            detections.forEach(lng => {
                if (found) return;

                let cleanedLng = this.services.languageUtils.formatLanguageCode(lng);

                if (this.services.languageUtils.isWhitelisted(cleanedLng)) {
                    found = cleanedLng;
                    ctx.i18nextLookupName = detectorOpt.name;
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
            if (this.detectors[cacheName] && this.detectors[cacheName].cacheUserLanguage) {
                this.detectors[cacheName].cacheUserLanguage(ctx, lng, this.options);
            }
        });
    }
}

LanguageDetector.type = 'languageDetector';

export default LanguageDetector;