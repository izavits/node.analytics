var integration = require('../../integration/index.js');
var gaLib = require('universal-analytics');

/**
 * Expose `GA` integration.
 */
var GA = module.exports = integration('GA')
    .global('ga')
    .option('propertyId', '')
    .option('strictCidFormat', false)
    .option('https', true);

/**
 * Initialize.
 *
 * @api public
 */
GA.prototype.initialize = function () {
    var propertyId = this.options.propertyId;
    var strictFormat = this.options.strictCidFormat;
    var protocol = this.options.https;
    global.ga = gaLib(propertyId, {
        strictCidFormat: strictFormat,
        https: protocol
    });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */
GA.prototype.loaded = function () {
    return !!(global.ga);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */
GA.prototype.identify = function (identify) {
    var userId = identify.userId();
    if (userId) {
        global.ga.set('uid', userId);
    }
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */
GA.prototype.track = function (track) {
    var props = track.properties();
    var eventAction = track.event();
    var eventCategory = props.category;
    var eventLabel = props.label;
    if (eventAction !== undefined && eventCategory !== undefined) {
        global.ga.event(eventCategory, eventAction, eventLabel);
    }
};