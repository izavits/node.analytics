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
    .option('release', null);

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
            // strip if there's only an empty string or null in the array since the settings UI lets you save additional rows even though some may be empty strings
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