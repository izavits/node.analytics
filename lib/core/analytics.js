var _analytics = global.analytics;
var Alias = require('segmentio-facade').Alias;
var Emitter = require('component-emitter');
var Group = require('segmentio-facade').Group;
var Identify = require('segmentio-facade').Identify;
var Page = require('segmentio-facade').Page;
var Track = require('segmentio-facade').Track;
var bindAll = require('bind-all');
var debug = require('debug');
var group = require('./group');
var is = require('is');
var memory = require('./memory');
var nextTick = require('next-tick');
var normalize = require('./normalize');
var user = require('./user');
var path = require('path');
var _ = require('lodash');
_.mixin(require('lodash-deep'));


/**
 * Initialize a new `Analytics` instance.
 */
function Analytics() {
    this._options({});
    this.Integrations = {};
    this._integrations = {};
    this._readied = false;
    this._timeout = 300;
    this._user = user;
    this.log = debug('analytics.js');
    bindAll(this);
}

/**
 * Mix in event emitter.
 */
Emitter(Analytics.prototype);

/**
 * Use a `plugin`.
 *
 * @param {Function} plugin
 * @return {Analytics}
 */
Analytics.prototype.use = function (plugin) {
    plugin(this);
    return this;
};

/**
 * Define a new `Integration`.
 *
 * @param {Function} Integration
 * @return {Analytics}
 */
Analytics.prototype.addIntegration = function (Integration) {
    var name = Integration.prototype.name;
    if (!name) throw new TypeError('attempted to add an invalid integration');
    this.Integrations[name] = Integration;
    return this;
};

/**
 * Initialize with the given integration `settings` and `options`.
 *
 * Aliased to `init` for convenience.
 *
 * @param {Object} [settings={}]
 * @param {Object} [options={}]
 * @return {Analytics}
 */
Analytics.prototype.init = Analytics.prototype.initialize = function (settings, options) {
    settings = settings || {};
    options = options || {};

    this._options(options);
    this._readied = false;

    // clean unknown integrations from settings
    var self = this;
    _.each(settings, function (opts, name) {
        var Integration = self.Integrations[name];
        if (!Integration) delete settings[name];
    });

    // add integrations
    _.each(settings, function (opts, name) {
        var Integration = self.Integrations[name];
        var integration = new Integration(_.cloneDeep(opts));
        self.log('initialize %o - %o', name, opts);
        self.add(integration);
    });

    var integrations = this._integrations;

    user.load();
    group.load();

    var integrationCount = _.keys(integrations).length;
    var ready = _.after(integrationCount, function () {
        self._readied = true;
        self.emit('ready');
    });

    // init if no integrations
    if (integrationCount <= 0) {
        ready();
    }

    // initialize integrations, passing ready
    _.each(integrations, function (integration) {
        integration.analytics = self;
        integration.once('ready', ready);
        integration.initialize();
    });
    this.initialized = true;
    this.emit('initialize', settings, options);
    return this;
};

/**
 * Set the user's `id`.
 *
 * @param {Mixed} id
 */
Analytics.prototype.setAnonymousId = function (id) {
    this.user().anonymousId(id);
    return this;
};

/**
 * Add an integration.
 *
 * @param {Integration} integration
 */
Analytics.prototype.add = function (integration) {
    this._integrations[integration.name] = integration;
    return this;
};

/**
 * Identify a user by optional `id` and `traits`.
 *
 * @param {string} [id=user.id()] User ID.
 * @param {Object} [traits=null] User traits.
 * @param {Object} [options=null]
 * @param {Function} [fn]
 * @return {Analytics}
 */
Analytics.prototype.identify = function (id, traits, options, fn) {
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(traits)) fn = traits, options = null, traits = null;
    if (is.object(id)) options = traits, traits = id, id = user.id();
    user.identify(id, traits);

    var msg = this.normalize({
        options: options,
        traits: traits,
        userId: user.id()
    });
    this._invoke('identify', new Identify(msg));
    this.emit('identify', id, traits, options);
    this._callback(fn);
    return this;
};

/**
 * Return the current user.
 *
 * @return {Object}
 */
Analytics.prototype.user = function () {
    return user;
};

/**
 * Identify a group by optional `id` and `traits`. Or, if no arguments are
 * supplied, return the current group.
 *
 * @param {string} [id=group.id()] Group ID.
 * @param {Object} [traits=null] Group traits.
 * @param {Object} [options=null]
 * @param {Function} [fn]
 * @return {Analytics|Object}
 */
Analytics.prototype.group = function (id, traits, options, fn) {
    if (!arguments.length) return group;
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(traits)) fn = traits, options = null, traits = null;
    if (is.object(id)) options = traits, traits = id, id = group.id();

    group.identify(id, traits);

    var msg = this.normalize({
        options: options,
        traits: traits,
        groupId: group.id()
    });
    this._invoke('group', new Group(msg));
    this.emit('group', id, traits, options);
    this._callback(fn);
    return this;
};

/**
 * Track an `event` that a user has triggered with optional `properties`.
 *
 * @param {string} event
 * @param {Object} [properties=null]
 * @param {Object} [options=null]
 * @param {Function} [fn]
 * @return {Analytics}
 */
Analytics.prototype.track = function (event, properties, options, fn) {
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(properties)) fn = properties, options = null, properties = null;

    // figure out if the event is archived.
    var plan = this.options.plan || {};
    var events = plan.track || {};

    var msg = this.normalize({
        properties: properties,
        options: options,
        event: event
    });
    // plan.
    plan = events[event];
    if (plan) {
        this.log('plan %o - %o', event, plan);
        if (plan.enabled === false) return this._callback(fn);
        _.defaults(msg.integrations, plan.integrations || {});
    }
    this._invoke('track', new Track(msg));
    this.emit('track', event, properties, options);
    this._callback(fn);
    return this;
};


/**
 * Merge two previously unassociated user identities.
 *
 * @param {string} to
 * @param {string} from (optional)
 * @param {Object} options (optional)
 * @param {Function} fn (optional)
 * @return {Analytics}
 */
Analytics.prototype.alias = function (to, from, options, fn) {
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(from)) fn = from, options = null, from = null;
    if (is.object(from)) options = from, from = null;

    var msg = this.normalize({
        options: options,
        previousId: from,
        userId: to
    });
    this._invoke('alias', new Alias(msg));
    this.emit('alias', to, from, options);
    this._callback(fn);
    return this;
};


/**
 * Capture an `exception`.
 *
 * @param {Object} exception
 * @param {Object} ops
 * @param {Function} [fn]
 * @return {Analytics}
 */
Analytics.prototype.captureException = function (exception, ops, fn) {
    var msg = {
        name: exception.name,
        message: exception.message,
        stack: exception.stack
    };
    this._invoke('captureException', new Track(msg), ops);
    this.emit('captureException', exception, ops);
    this._callback(fn);
    return this;
};

/**
 * Associate data with context for Sentry integration
 * @param {Object} traits
 * @param {Function} [fn]
 * @return {Analytics}
 */
Analytics.prototype.setContext = function (traits, fn) {
    var msg = this.normalize({
        traits: traits
    });
    this._invoke('setContext', new Identify(msg));
    this.emit('setContext', traits);
    this._callback(fn);
    return this;
};

/**
 * Associate data with context for Sentry integration
 * @param {Object} traits
 * @param {Function} [fn]
 * @return {Analytics}
 */
Analytics.prototype.mergeContext = function (traits, fn) {
    var msg = this.normalize({
        traits: traits
    });
    this._invoke('mergeContext', new Identify(msg));
    this.emit('mergeContext', traits);
    this._callback(fn);
    return this;
};

/**
 * Get request handler for Sentry integration
 *
 * @param fn
 * @returns {requestHandler}
 */
Analytics.prototype.requestHandler = function (fn) {
    return this._integrations.Sentry.requestHandler();
};

/**
 * Get error handler for Sentry integration
 *
 * @param fn
 * @returns {errorHandler}
 */
Analytics.prototype.errorHandler = function (fn) {
    return this._integrations.Sentry.errorHandler();
};


/**
 * Register a `fn` to be fired when all the analytics services are ready.
 *
 * @param {Function} fn
 * @return {Analytics}
 */
Analytics.prototype.ready = function (fn) {
    if (is.fn(fn)) {
        if (this._readied) {
            nextTick(fn);
        } else {
            this.once('ready', fn);
        }
    }
    return this;
};

/**
 * Set the `timeout` (in milliseconds) used for callbacks.
 *
 * @param {Number} timeout
 */
Analytics.prototype.timeout = function (timeout) {
    this._timeout = timeout;
};

/**
 * Enable or disable debug.
 *
 * @param {string|boolean} str
 */
Analytics.prototype.debug = function (str) {
    if (!arguments.length || str) {
        debug.enable('analytics:' + (str || '*'));
    } else {
        debug.disable();
    }
};

/**
 * Apply options.
 *
 * @param {Object} options
 * @return {Analytics}
 * @api private
 */
Analytics.prototype._options = function (options) {
    options = options || {};
    this.options = options;
    user.options(options.user);
    group.options(options.group);
    return this;
};

/**
 * Callback a `fn` after our defined timeout period.
 *
 * @param {Function} fn
 * @return {Analytics}
 * @api private
 */
Analytics.prototype._callback = function (fn) {
    if (is.fn(fn)) {
        this._timeout ? setTimeout(fn, this._timeout) : nextTick(fn);
    }
    return this;
};

/**
 * Call `method` with `facade` on all enabled integrations.
 *
 * @param {string} method
 * @param {Facade} facade
 * @param {Object} ops
 * @return {Analytics}
 * @api private
 */
Analytics.prototype._invoke = function (method, facade, ops) {
    this.emit('invoke', facade);
    _.each(this._integrations, function (integration, name) {
        if (!facade.enabled(name)) return;
        integration.invoke.call(integration, method, facade, ops);
    });

    return this;
};

/**
 * Push `args`.
 *
 * @param {Array} args
 * @api private
 */
Analytics.prototype.push = function (args) {
    var method = args.shift();
    if (!this[method]) return;
    this[method].apply(this, args);
};

/**
 * Reset group and user traits and id's.
 *
 * @api public
 */
Analytics.prototype.reset = function () {
    this.user().logout();
    this.group().logout();
};

/**
 * Normalize the given `msg`.
 *
 * @param {Object} msg
 * @return {Object}
 */
Analytics.prototype.normalize = function (msg) {
    msg = normalize(msg, _.keys(this._integrations));
    if (msg.anonymousId) user.anonymousId(msg.anonymousId);
    msg.anonymousId = user.anonymousId();
    return msg;
};

/**
 * Create an object clone with all absolute paths replaced with the path basename
 * @param object
 * @returns {*}
 */
Analytics.prototype.anonymize = function (object) {
    if (_.isError(object)) {
        // Turn the Error into an Object
        object = _.reduce(Object.getOwnPropertyNames(object), function (accumulator, key) {
            accumulator[key] = object[key];
            return accumulator;
        }, {});
    }
    if (_.isString(object)) {
        var words = object.split(' ').map(function (word) {
            return path.isAbsolute(word) ? path.basename(word) : word;
        });
        return words.join(' ');
    }
    return _.deepMapValues(object, function (value) {
        if (!_.isString(value)) {
            return value;
        }
        // Don't alter disk devices, even though they appear as full paths
        if (value.startsWith('/dev/') || value.startsWith('\\\\.\\')) {
            return value
        }
        return path.isAbsolute(value) ? path.basename(value) : value
    });
};

/**
 * No conflict support.
 */
Analytics.prototype.noConflict = function () {
    global.analytics = _analytics;
    return this;
};

module.exports = Analytics;
module.exports.memory = memory;
