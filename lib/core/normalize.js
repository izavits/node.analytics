var debug = require('debug')('analytics.js:normalize');
var type = require('component-type');
var _ = require('lodash');
var has = Object.prototype.hasOwnProperty;

module.exports = normalize;

/**
 * Toplevel properties.
 */
var toplevel = [
    'integrations',
    'anonymousId',
    'timestamp',
    'context'
];

/**
 * Normalize `msg` based on integrations `list`.
 *
 * @param {Object} msg
 * @param {Array} list
 * @return {Function}
 */
function normalize(msg, list) {
    var lower = _.map(list, function (s) {
        return s.toLowerCase();
    });
    var opts = msg.options || {};
    var integrations = opts.integrations || {};
    var providers = opts.providers || {};
    var context = opts.context || {};
    var ret = {};
    debug('<-', msg);

    // integrations.
    _.each(opts, function (value, key) {
        if (!integration(key)) return;
        if (!has.call(integrations, key)) integrations[key] = value;
        delete opts[key];
    });

    // providers.
    delete opts.providers;
    _.each(providers, function (value, key) {
        if (!integration(key)) return;
        if (type(integrations[key]) === 'object') return;
        if (has.call(integrations, key) && typeof providers[key] === 'boolean') return;
        integrations[key] = value;
    });

    // move all toplevel options to msg
    // and the rest to context.
    _.each(opts, function (value, key) {
        if (_.includes(toplevel, key)) {
            ret[key] = opts[key];
        } else {
            context[key] = opts[key];
        }
    });

    // cleanup
    delete msg.options;
    ret.integrations = integrations;
    ret.context = context;
    ret = _.defaults(ret, msg);
    debug('->', ret);
    return ret;

    function integration(name) {
        return !!(_.includes(list, name) || name.toLowerCase() === 'all' || _.includes(lower, name.toLowerCase()));
    }
}
