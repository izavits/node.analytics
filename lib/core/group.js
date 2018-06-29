var Entity = require('./entity');
var bindAll = require('bind-all');
var util = require('util');
var inherit = util.inherits;

/**
 * Group defaults
 */
Group.defaults = {
    persist: true,
    localStorage: {
        key: 'ajs_group_properties'
    }
};

/**
 * Initialize a new `Group` with `options`.
 *
 * @param {Object} options
 */
function Group(options) {
    this.defaults = Group.defaults;
    Entity.call(this, options);
}

/**
 * Inherit `Entity`
 */
inherit(Group, Entity);

/**
 * Expose the group singleton.
 */
module.exports = bindAll(new Group());

/**
 * Expose the `Group` constructor.
 */
module.exports.Group = Group;
