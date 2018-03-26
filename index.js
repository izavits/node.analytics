// Export the core analytics lib and the integrations

var core = require('./lib/core/index.js');
var mixpanelIntegration = require('./lib/integrations/mixpanel-node/index.js');
var sentryIntegration = require('./lib/integrations/sentry-node/index.js');
var gosquaredIntegration = require('./lib/integrations/gosquared-node/index.js');
var gaIntegration = require('./lib/integrations/ga-node/index.js');

module.exports = {
    core: core,
    mixpanelIntegration: mixpanelIntegration,
    sentryIntegration: sentryIntegration,
    gosquaredIntegration: gosquaredIntegration,
    googleAnalyticsIntegration: gaIntegration
};
