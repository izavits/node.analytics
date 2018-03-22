var debug = require('debug')('analytics:entity');
var memory = require('./memory');
var store = require('./store');
var isodateTraverse = require('@segment/isodate-traverse');
var _ = require('lodash');

module.exports = Entity;

/**
 * Initialize new `Entity` with `options`.
 *
 * @param {Object} options
 */
function Entity(options) {
    this.options(options);
    this.initialize();
}

/**
 * Initialize picks the storage.
 *
 * Checks to see if cookies can be set
 * otherwise fallsback to localStorage.
 */
Entity.prototype.initialize = function () {
    debug('Using memory storage');
    this._storage = memory;
    this._traits = {};
};

/**
 * Get the storage.
 */
Entity.prototype.storage = function () {
    return this._storage;
};


/**
 * Get or set storage `options`.
 *
 * @param {Object} options
 *   @property {Object} cookie
 *   @property {Object} localStorage
 *   @property {Boolean} persist (default: `true`)
 */
Entity.prototype.options = function (options) {
    if (arguments.length === 0) return this._options;
    this._options = _.defaults(options || {}, this.defaults || {});
};

/**
 * Get or set the entity's `id`.
 *
 * @param {String} id
 */
Entity.prototype.id = function (id) {
    switch (arguments.length) {
        case 0:
            return this._getId();
        case 1:
            return this._setId(id);
        default:
        // No default case
    }
};

/**
 * Get the entity's id.
 *
 * @return {String}
 */
Entity.prototype._getId = function () {
    var ret = this._id;
    return ret === undefined ? null : ret;
};

/**
 * Set the entity's `id`.
 *
 * @param {String} id
 */
Entity.prototype._setId = function (id) {
    this._id = id;
};

/**
 * Get or set the entity's `traits`.
 *
 * BACKWARDS COMPATIBILITY: aliased to `properties`
 *
 * @param {Object} traits
 */
Entity.prototype.properties = Entity.prototype.traits = function (traits) {
    switch (arguments.length) {
        case 0:
            return this._getTraits();
        case 1:
            return this._setTraits(traits);
        default:
        // No default case
    }
};

/**
 * Get the entity's traits. Always convert ISO date strings into real dates,
 * since they aren't parsed back from local storage.
 *
 * @return {Object}
 */
Entity.prototype._getTraits = function () {
    var ret = this._traits;
    return ret ? isodateTraverse(_.cloneDeep(ret)) : {};
};

/**
 * Set the entity's `traits`.
 *
 * @param {Object} traits
 */
Entity.prototype._setTraits = function (traits) {
    traits = traits || {};
    if (this._options.persist) {
        store.set(this._options.localStorage.key, traits);
        this._traits = traits;
    } else {
        this._traits = traits;
    }
};

/**
 * Identify the entity with an `id` and `traits`. If we it's the same entity,
 * extend the existing `traits` instead of overwriting.
 *
 * @param {String} id
 * @param {Object} traits
 */
Entity.prototype.identify = function (id, traits) {
    traits = traits || {};
    var current = this.id();
    if (current === null || current === id) traits = _.extend(this.traits(), traits);
    if (id) this.id(id);
    this.debug('identify %o, %o', id, traits);
    this.traits(traits);
    this.save();
};


/**
 * Save the entity to local storage and the cookie.
 *
 * @return {Boolean}
 */
Entity.prototype.save = function () {
    if (!this._options.persist) return false;
    store.set(this._options.localStorage.key, this.traits());
    return true;
};

/**
 * Log the entity out, reseting `id` and `traits` to defaults.
 */
Entity.prototype.logout = function () {
    this.id(null);
    this.traits({});
};

/**
 * Reset all entity state, logging out and returning options to defaults.
 */
Entity.prototype.reset = function () {
    this.logout();
    this.options({});
};

/**
 * Load saved entity `id` or `traits` from storage.
 */
Entity.prototype.load = function () {
    this.traits(store.get(this._options.localStorage.key));
};
