var integration = require('../../integration/index.js');
var omit = require('omit');
var pick = require('pick');
var GosquaredLib = require('gosquared');

/**
 * Expose `Gosquared` integration.
 */
var Gosquared = module.exports = integration('Gosquared')
    .global('gosquared')
    .option('api_key', '')
    .option('site_token', '');

/**
 * Initialize.
 *
 * @api public
 */
Gosquared.prototype.initialize = function () {
    var apiKey = this.options.api_key;
    var gosquaredId = this.options.site_token;
    global.gosquared = new GosquaredLib({
        api_key: apiKey,
        site_token: gosquaredId
    });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */
Gosquared.prototype.loaded = function () {
    return !!(global.gosquared);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */
Gosquared.prototype.identify = function (identify) {
    var traits = identify.traits({
        createdAt: 'created_at',
        firstName: 'first_name',
        lastName: 'last_name',
        title: 'company_position',
        industry: 'company_industry'
    });
    var specialKeys = [
        'id',
        'email',
        'name',
        'first_name',
        'last_name',
        'username',
        'description',
        'avatar',
        'phone',
        'created_at',
        'company_name',
        'company_size',
        'company_position',
        'company_industry'
    ];
    var props = pick.apply(null, [traits].concat(specialKeys));
    props.custom = omit(specialKeys, traits);
    var id = identify.userId();
    var person;
    if (id) {
        person = global.gosquared.createPerson(id);
        person.identify(props);
        global.gosquared = person;
    }
    else {
        person = global.gosquared.createPerson();
        person.identify(props);
        global.gosquared = person;
    }
};

/**
 * Track.
 *
 * According to GoSquared documentation:
 *
 * Note: in the Now dashboard, events are associated with online
 * visitor sessions. This means that when the visitor goes offline,
 * that visitor and the events for them are no longer visible.
 * Meanwhile, the number of times the event is triggered is cumulative
 * and is always shown in the Trends dashboard for any time period.
 *
 * Additionally, only events tracked using the Javascript website tracker
 * show in the Now dashboard.
 * Events tracked via backend modules show in the Trends dashboard only.
 *
 * Node sdk does not support pageviews
 * https://www.gosquared.com/docs/api/tracking/pageview/node/
 *
 * @api public
 * @param {Track} track
 */
Gosquared.prototype.track = function (track) {
    var event = track.event();
    var props = track.properties();
    global.gosquared.trackEvent(event, props);
};
