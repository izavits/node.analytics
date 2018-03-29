var bind = require('component-bind');
var debug = require('debug');
var protos = require('./protos');
var statics = require('./statics');
var _ = require('lodash');

/**
 * Create a new `Integration` constructor.
 *
 * @constructs Integration
 * @param {string} name
 * @return {Function} Integration
 */

function createIntegration(name) {
  /**
   * Initialize a new `Integration`.
   *
   * @class
   * @param {Object} options
   */

  function Integration(options) {
    if (options && options.addIntegration) {
      return options.addIntegration(Integration);
    }
    this.debug = debug('analytics:integration:' + name);
    this.options = _.defaults(_.cloneDeep(options) || {}, this.defaults);
    this._queue = [];
    this.once('ready', bind(this, this.flush));

    Integration.emit('construct', this);
    this.ready = bind(this, this.ready);
    this._wrapInitialize();
    this._wrapTrack();
  }

  Integration.prototype.defaults = {};
  Integration.prototype.globals = [];
  Integration.prototype.templates = {};
  Integration.prototype.name = name;
  _.extend(Integration, statics);
  _.extend(Integration.prototype, protos);

  return Integration;
}

module.exports = createIntegration;
