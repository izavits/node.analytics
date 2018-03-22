var alias = require('@segment/alias');
var dates = require('@segment/convert-dates');
var includes = require('@ndhoule/includes');
var integration = require('../../integration/index.js');
var iso = require('@segment/to-iso-string');
var is = require('is');
var indexOf = require('component-indexof');
var MixpanelLib = require('mixpanel');

/**
 * Expose `Mixpanel` integration.
 */
var Mixpanel = module.exports = integration('Mixpanel')
    .global('mixpanel')
    .option('people', true)
    .option('token', '');

/**
 * Initialize.
 *
 * @api public
 */

Mixpanel.prototype.initialize = function () {
    var options = this.options;
    options.protocol = 'https';
    global.mixpanel = MixpanelLib.init(options.token, options);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */
Mixpanel.prototype.loaded = function () {
    return !!(global.mixpanel);
};


/**
 * Trait aliases.
 */
var traitAliases = {
    created: '$created',
    email: '$email',
    firstName: '$first_name',
    lastName: '$last_name',
    lastSeen: '$last_seen',
    name: '$name',
    username: '$username',
    phone: '$phone'
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */
Mixpanel.prototype.identify = function (identify) {
    var id = identify.userId();
    var people = this.options.people;
    var traits = identify.traits(traitAliases);

    if (people) {
        var peopleProps = traits;
        if (!is.empty(peopleProps)) global.mixpanel.people.set(id, peopleProps);
    }
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */
Mixpanel.prototype.track = function (track) {
    var increments = this.options.increments;
    var increment = track.event().toLowerCase();
    var people = this.options.people;
    var props = track.properties();
    var revenue = track.revenue();

    // increment properties in mixpanel people
    if (people && includes(increment, increments)) {
        global.mixpanel.people.increment(track.event());
        global.mixpanel.people.set('Last ' + track.event(), new Date());
    }
    // track the event
    props = dates(props, iso);
    global.mixpanel.track(track.event(), props);

    // track revenue specifically
    if (revenue && people) {
        global.mixpanel.people.track_charge(revenue);
    }
};

/**
 * Alias.
 *
 * @api public
 * @param {Alias} alias
 */
Mixpanel.prototype.alias = function (alias) {
    var mp = global.mixpanel;
    var to = alias.to();
    // although undocumented, mixpanel takes an optional original id
    mp.alias(to, alias.from());
};

/**
 * Lowercase the given `arr`.
 *
 * @api private
 * @param {Array} arr
 * @return {Array}
 */
function lowercase(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < arr.length; ++i) {
        ret[i] = String(arr[i]).toLowerCase();
    }
    return ret;
}

/**
 * Map Special traits in the given `arr`.
 * From the TraitAliases for Mixpanel's special props
 *
 * @api private
 * @param {Array} arr
 * @return {Array}
 */
function mapTraits(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < arr.length; ++i) {
        if (traitAliases.hasOwnProperty(arr[i])) {
            ret.push(traitAliases[arr[i]]);
        } else {
            ret.push(arr[i]);
        }
    }
    return ret;
}

/**
 * extend Mixpanel's special trait keys in the given `arr`.
 *
 * @api private
 * @param {Array} arr
 * @return {Array}
 */
function extendTraits(arr) {
    var keys = [];
    for (var key in traitAliases) {
        if (traitAliases.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    for (var i = 0; i < keys.length; ++i) {
        if (indexOf(arr, keys[i]) < 0) {
            arr.push(keys[i]);
        }
    }
    return arr;
}
