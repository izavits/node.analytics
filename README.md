# node.analytics

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

