var Analytics = require('./analytics');

var analytics = new Analytics();

analytics.require = require;

analytics.VERSION = require('../../package.json').version;

if (process.env.AGREEMENT) {
  analytics.AGREEMENT = process.env.AGREEMENT;
}
else {
  analytics.AGREEMENT = 'Version ' + analytics.VERSION + '\nThis is a Licence Agreement (the "Agreement") for software modules that use the analytica package ' +
      'and are used to connect to an analytics infrastructure.\nPlease read this Agreement.\n' +
      'The software consists, amongst others, of an analytics module. This module exposes an interface through which analytics data ' +
      'is collected during a user\'s normal runtime execution.\nThis data can be used and analyzed in order to provide insights regarding a ' +
      'product\'s capabilities and the users\' behavior, aiming to improve the overall user experience.\n';
}

module.exports = analytics;
