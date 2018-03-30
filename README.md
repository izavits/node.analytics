# node.analytics

> A library to integrate analytics to nodejs applications

[![Build Status](https://travis-ci.org/izavits/node.analytics.svg?branch=master)](https://travis-ci.org/izavits/node.analytics)
[![npm](https://badge.fury.io/js/analytica.svg)](https://www.npmjs.com/package/analytica)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Semver](https://img.shields.io/:semver-2.0.0-brightgreen.svg?style=flat-square)](http://semver.org)

## Install
Via npm:

```
npm install --save analytica
```

## API
The module exports methods to:
- require the core analytics lib
- require the provided integrations
- add the desired integration
- initialize the library
- track event

Example usage:

Require the core analytics library and the mixpanel integration:

```
var analytics = require('analytica').core;
var mp = require('analytica').mixpanelIntegration;
analytics.addIntegration(mp);
var options = {token: "<YOUR_TOKEN>"};
analytics.initialize({'Mixpanel': options});
```

Identify user and track event:

```
analytics.identify(123, { name: 'testuser', email: 'testemail@test.com', '$distinct_id': 123 },
  function () {
    console.log('done identifying user');
  });

analytics.track('my event', { distinct_id: 123, descr: 'test event' },
  function () {
    console.log('done tracking event');
  });
```

## Support
If you're having any problem, please raise an issue on GitHub

## Tests
Run the test suite by doing:

```
npm test
```

## License
The project is licensed under the Apache 2.0 license.
