var bindAll = require('bind-all');
var _ = require('lodash');
var has = Object.prototype.hasOwnProperty;

module.exports = bindAll(new Memory());

/**
 * Initialize `Memory` store
 */
function Memory() {
    this.store = {};
}

/**
 * Set a `key` and `value`.
 *
 * @param {String} key
 * @param {Mixed} value
 * @return {Boolean}
 */
Memory.prototype.set = function (key, value) {
    this.store[key] = _.cloneDeep(value);
    return true;
};

/**
 * Get a `key`.
 *
 * @param {String} key
 */
Memory.prototype.get = function (key) {
    if (!has.call(this.store, key)) return;
    return _.cloneDeep(this.store[key]);
};

/**
 * Remove a `key`.
 *
 * @param {String} key
 * @return {Boolean}
 */
Memory.prototype.remove = function (key) {
    delete this.store[key];
    return true;
};
