var Entity = require('./entity');
var bindAll = require('bind-all');
var util = require('util');
var inherit = util.inherits;
var uuid = require('uuid');

User.defaults = {
    persist: true,
    localStorage: {
        key: 'ajs_user_traits'
    }
};

/**
 * Initialize a new `User` with `options`.
 *
 * @param {Object} options
 */
function User(options) {
    this.defaults = User.defaults;
    Entity.call(this, options);
}

/**
 * Inherit `Entity`
 */
inherit(User, Entity);

/**
 * Set/get the user id.
 *
 * When the user id changes, the method will reset his anonymousId to a new one.
 *
 * @param {string} id
 * @return {Mixed}
 * @example
 * // didn't change because the user didn't have previous id.
 * anonymousId = user.anonymousId();
 * user.id('foo');
 * assert.equal(anonymousId, user.anonymousId());
 *
 * // didn't change because the user id changed to null.
 * anonymousId = user.anonymousId();
 * user.id('foo');
 * user.id(null);
 * assert.equal(anonymousId, user.anonymousId());
 *
 * // change because the user had previous id.
 * anonymousId = user.anonymousId();
 * user.id('foo');
 * user.id('baz'); // triggers change
 * user.id('baz'); // no change
 * assert.notEqual(anonymousId, user.anonymousId());
 */
User.prototype.id = function (id) {
    var prev = this._getId();
    var ret = Entity.prototype.id.apply(this, arguments);
    if (prev == null) return ret;
    if (prev != id && id) this.anonymousId(null);
    return ret;
};

/**
 * Set / get / remove anonymousId.
 *
 * @param {String} anonymousId
 * @return {String|User}
 */
User.prototype.anonymousId = function (anonymousId) {
    var store = this.storage();

    // set / remove
    if (arguments.length) {
        store.set('ajs_anonymous_id', anonymousId);
        return this;
    }
    // new
    anonymousId = store.get('ajs_anonymous_id');
    if (anonymousId) {
        return anonymousId;
    }
    // empty
    anonymousId = uuid.v4();
    store.set('ajs_anonymous_id', anonymousId);
    return store.get('ajs_anonymous_id');
};

/**
 * Remove anonymous id on logout too.
 */
User.prototype.logout = function () {
    Entity.prototype.logout.call(this);
    this.anonymousId(null);
};

/**
 * Load saved user `id` or `traits` from storage.
 */
User.prototype.load = function () {
    Entity.prototype.load.call(this);
};

module.exports = bindAll(new User());
module.exports.User = User;
