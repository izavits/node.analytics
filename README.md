# node.analytics
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Example

```
// Require the core analytics lib
var analytics = require('analytics.node').core;

// Require the mixpanel integration
var mp = require('analytics.node').mixpanelIntegration;

var options = {token: "<YOUR_TOKEN>"};
analytics.addIntegration(mp);
analytics.initialize({'Mixpanel': options});

analytics.identify(123, { name: 'testuser', email: 'testemail@test.com', '$distinct_id': 123 }, function () {
    console.log('done identifying user');
});

analytics.track('my event', { distinct_id: 123, descr: 'test event' }, function () {
    console.log('done tracking event');
});
```

