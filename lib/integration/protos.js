var Emitter = require('component-emitter');
var events = require('analytics-events');
var is = require('is');
var nextTick = require('next-tick');
var normalize = require('to-no-case');
var has = Object.prototype.hasOwnProperty;
var _ = require('lodash');
var onerror = null;
var onload = null;

Emitter(exports);

/**
 * Initialize.
 */
exports.initialize = function () {
    var ready = this.ready;
    nextTick(ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

exports.loaded = function () {
    return false;
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

exports.page = function (page) {
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

exports.track = function (track) {
};

/**
 * Get values from items in `options` that are mapped to `key`.
 * `options` is an integration setting which is a collection
 * of type 'map', 'array', or 'mixed'
 *
 * Use cases include mapping events to pixelIds (map), sending generic
 * conversion pixels only for specific events (array), or configuring dynamic
 * mappings of event properties to query string parameters based on event (mixed)
 *
 * @api public
 * @param {Object|Object[]|String[]} options An object, array of objects, or
 * array of strings pulled from settings.mapping.
 * @param {string} key The name of the item in options whose metadata
 * we're looking for.
 * @return {Array} An array of settings that match the input `key` name.
 * @example
 *
 * // 'Map'
 * var events = { my_event: 'a4991b88' };
 * .map(events, 'My Event');
 * // => ["a4991b88"]
 * .map(events, 'whatever');
 * // => []
 *
 * // 'Array'
 * * var events = ['Completed Order', 'My Event'];
 * .map(events, 'My Event');
 * // => ["My Event"]
 * .map(events, 'whatever');
 * // => []
 *
 * // 'Mixed'
 * var events = [{ key: 'my event', value: '9b5eb1fa' }];
 * .map(events, 'my_event');
 * // => ["9b5eb1fa"]
 * .map(events, 'whatever');
 * // => []
 */

exports.map = function (options, key) {
    var normalizedComparator = normalize(key);
    var mappingType = getMappingType(options);

    if (mappingType === 'unknown') {
        return [];
    }

    return _.reduce(options, function (matchingValues, val, key) {
        var compare;
        var result;

        if (mappingType === 'map') {
            compare = key;
            result = val;
        }

        if (mappingType === 'array') {
            compare = val;
            result = val;
        }

        if (mappingType === 'mixed') {
            compare = val.key;
            result = val.value;
        }

        if (normalize(compare) === normalizedComparator) {
            matchingValues.push(result);
        }

        return matchingValues;
    }, []);
};

/**
 * Invoke a `method` that may or may not exist on the prototype with `args`,
 * queueing or not depending on whether the integration is "ready". Don't
 * trust the method call, since it contains integration party code.
 *
 * @api private
 * @param {string} method
 * @param {...*} args
 */

exports.invoke = function (method) {
    if (!this[method]) return;
    var args = Array.prototype.slice.call(arguments, 1);
    //if (!this._ready) return this.queue(method, args);
    var ret;

    try {
        this.debug('%s with %o', method, args);
        ret = this[method].apply(this, args);
    } catch (e) {
        this.debug('error %o calling %s with %o', e, method, args);

    }

    return ret;
};

/**
 * Queue a `method` with `args`.
 *
 * @api private
 * @param {string} method
 * @param {Array} args
 */

exports.queue = function (method, args) {
    this._queue.push({ method: method, args: args });
};

/**
 * Flush the internal queue.
 *
 * @api private
 */

exports.flush = function () {
    this._ready = true;
    var self = this;

    _.each(this._queue, function (call) {
        self[call.method].apply(self, call.args);
    });

    // Empty the queue.
    this._queue.length = 0;
};

/**
 * Reset the integration, removing its global variables.
 *
 * @api private
 */

exports.reset = function () {
    for (var i = 0; i < this.globals.length; i++) {
        global[this.globals[i]] = undefined;
    }

    global.onerror = onerror;
    global.onload = onload;
};

/**
 * Locals for tag templates.
 *
 * By default it includes a cache buster and all of the options.
 *
 * @param {Object} [locals]
 * @return {Object}
 */

exports.locals = function (locals) {
    locals = locals || {};
    var cache = Math.floor(new Date().getTime() / 3600000);
    if (!locals.hasOwnProperty('cache')) locals.cache = cache;
    each(function (val, key) {
        if (!locals.hasOwnProperty(key)) locals[key] = val;
    }, this.options);
    return locals;
};

/**
 * Simple way to emit ready.
 *
 * @api public
 */

exports.ready = function () {
    this.emit('ready');
};

/**
 * Wrap the initialize method in an exists check, so we don't have to do it for
 * every single integration.
 *
 * @api private
 */

exports._wrapInitialize = function () {
    var initialize = this.initialize;
    this.initialize = function () {
        this.debug('initialize');
        this._initialized = true;
        var ret = initialize.apply(this, arguments);
        this.emit('initialize');
        return ret;
    };
};

/**
 * Wrap the page method to call to noop the first page call if the integration assumes
 * a pageview.
 *
 * @api private
 */

exports._wrapPage = function () {
    // Noop the first page call if integration assumes pageview
    if (this._assumesPageview) return this.page = _.after(2, this.page);
};

/**
 * Wrap the track method to call other ecommerce methods if available depending
 * on the `track.event()`.
 *
 * @api private
 */

exports._wrapTrack = function () {
    var t = this.track;
    this.track = function (track) {
        var event = track.event();
        var called;
        var ret;

        for (var method in events) {
            if (has.call(events, method)) {
                var regexp = events[method];
                if (!this[method]) continue;
                if (!regexp.test(event)) continue;
                ret = this[method].apply(this, arguments);
                called = true;
                break;
            }
        }

        if (!called) ret = t.apply(this, arguments);
        return ret;
    };
};

/**
 * Determine the type of the option passed to `#map`
 *
 * @api private
 * @param {Object|Object[]} mapping
 * @return {String} mappingType
 */

function getMappingType(mapping) {
    if (is.array(mapping)) {
        return _.every(mapping, isMixed) ? 'mixed' : 'array';
    }
    if (is.object(mapping)) return 'map';
    return 'unknown';
}

/**
 * Determine if item in mapping array is a valid "mixed" type value
 *
 * Must be an object with properties "key" (of type string)
 * and "value" (of any type)
 *
 * @api private
 * @param {*} item
 * @return {Boolean}
 */

function isMixed(item) {
    if (!is.object(item)) return false;
    if (!is.string(item.key)) return false;
    if (!has.call(item, 'value')) return false;
    return true;
}
