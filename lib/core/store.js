var bindAll = require('bind-all');
var store = require('@segment/store');
var _ = require('lodash');

/**
 * Initialize a new `Store` with `options`.
 *
 * @param {Object} options
 */
function Store(options) {
    this.options(options);
}

/**
 * Set the `options` for the store.
 *
 * @param {Object} options
 *   @field {Boolean} enabled (true)
 */
Store.prototype.options = function (options) {
    if (arguments.length === 0) return this._options;

    options = options || {};
    _.defaults(options, { enabled: true });

    this.enabled = options.enabled && store.enabled;
    this._options = options;
};


/**
 * Set a `key` and `value` in local storage.
 *
 * @param {string} key
 * @param {Object} value
 */
Store.prototype.set = function (key, value) {
    if (!this.enabled) return false;
    return store.set(key, value);
};


/**
 * Get a value from local storage by `key`.
 *
 * @param {string} key
 * @return {Object}
 */
Store.prototype.get = function (key) {
    if (!this.enabled) return null;
    return store.get(key);
};


/**
 * Remove a value from local storage by `key`.
 *
 * @param {string} key
 */
Store.prototype.remove = function (key) {
    if (!this.enabled) return false;
    return store.remove(key);
};


module.exports = bindAll(new Store());
module.exports.Store = Store;
