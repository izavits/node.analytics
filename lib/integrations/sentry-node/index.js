var integration = require('../../integration/index.js');
var is = require('is');
var foldl = require('@ndhoule/foldl');
var SentryLib = require('raven');

/**
 * Expose `Sentry` integration.
 */
var Sentry = module.exports = integration('Sentry')
    .global('sentry')
    .option('config', '')
    .option('serverName', null)
    .option('release', null)
    .option('captureUnhandledRejections', true)
    .option('disableConsoleAlerts', true);

/**
 * Initialize.
 *
 * @api public
 */
Sentry.prototype.initialize = function () {
    var dsnPublic = this.options.config;
    var options = {
        release: this.options.release,
        serverName: this.options.serverName
    };
    if (this.options.disableConsoleAlerts === true) {
        SentryLib.disableConsoleAlerts();
    }
    global.sentry = SentryLib.config(dsnPublic, reject(options)).install();
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */
Sentry.prototype.loaded = function () {
    return !!(global.sentry);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */
Sentry.prototype.identify = function (identify) {
    var traits = identify.traits();
    global.sentry.setContext(traits);
};

/**
 * setContext - Associate data with context
 *
 * @api public
 * @param {Identify} identify
 */
Sentry.prototype.setContext = function (identify) {
    var traits = identify.traits();
    if (!global.sentry) {
        SentryLib.setContext(traits);
    }
    global.sentry.setContext(traits);
};

/**
 * mergeContext - Associate data with context
 *
 * @api public
 * @param {Identify} identify
 */
Sentry.prototype.mergeContext = function (identify) {
    var traits = identify.traits();
    if (!global.sentry) {
        SentryLib.setContext(traits);
    }
    global.sentry.mergeContext(traits);
};

/**
 * Capture Exception
 *
 * @api public
 * @param {Exception} exception
 */
Sentry.prototype.captureException = function (exception) {
    var e = new Error(exception.obj.message);
    e.name = exception.obj.name;
    e.stack = exception.obj.stack;
    global.sentry.captureException(e);
};

/**
 * Clean out empty values
 */
function reject(obj) {
    return foldl(function (result, val, key) {
        // strip any null or empty string values
        if (val !== null && val !== '' && !is.array(val)) {
            result[key] = val;
        }
        // strip any empty arrays
        if (is.array(val)) {
            var ret = [];
            for (var x = 0; x < val.length; x++) {
                if (val[x] !== null && val[x] !== '') ret.push(val[x]);
            }
            if (!is.empty(ret)) {
                result[key] = ret;
            }
        }
        return result;
    }, {}, obj);
}