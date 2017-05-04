export default {
    name: 'session',

    lookup(ctx, options) {
        let found;
        if (options.lookupSession && ctx && ctx.session) {
            found = ctx.session[options.lookupSession];
        }
        return found;
    },

    cacheUserLanguage(ctx, lng, options = {}) {
        if (options.lookupSession && ctx && ctx.session) {
            ctx.session[options.lookupSession] = lng;
        }
    }
};