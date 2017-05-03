const Cookies = require('cookies');

export default {
    name: 'cookie',

    lookup(ctx, options) {
        let found;

        if (options.lookupCookie && typeof ctx !== 'undefined') {
            if (ctx.cookies) {
                found = ctx.cookies.get(options.lookupCookie);
            } else {
                const cookies = new Cookies(ctx.request, ctx.response);
                found = cookies.get(options.lookupCookie);
            }
        }

        return found;
    },

    cacheUserLanguage(ctx, lng, options = {}) {
        if (options.lookupCookie && ctx !== 'undefined') {
            let expirationDate = options.cookieExpirationDate;
            if (!expirationDate) {
                expirationDate = new Date();
                expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            }
            ctx.cookies.set(options.lookupCookie, lng, {
                expires: expirationDate,
                domain: options.cookieDomain,
                httpOnly: false
            })
        }
    }
};