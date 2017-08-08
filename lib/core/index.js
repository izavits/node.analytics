var Analytics = require('./analytics');

var analytics = new Analytics();

analytics.require = require;

analytics.VERSION = require('../../package.json').version;

module.exports = analytics;
