var analytics = require('../lib/core/index.js');
var assert = require('proclaim');

describe('Core', function () {
    it('should expose a .VERSION', function () {
        var pkg = require('../package.json');
        assert.equal(analytics.VERSION, pkg.version);
    });
});