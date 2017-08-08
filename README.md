# node.analytics

## Example

```
// Require the core analytics lib
var core = require('./lib/core/index.js');
// Require the mixpanel integration
var mp = require('./lib/integrations/mixpanel-node/index.js');
var options = {token: "<YOUR_TOKEN>"};
core.addIntegration(mp);
core.initialize({'Mixpanel': options});

core.identify(123, {name: 'testuser', email: 'testemail4@test.com', "$distinct_id":123}, function () {
    console.log('done identifying user');
});

core.track('my event', {distinct_id: 123, descr: 'test event'}, function () {
    console.log('done tracking event');
});
```

