var Analytics = require('../lib/core/index.js').constructor;
var integration = require('../lib/integration/index.js');
var tester = require('../lib/integration-tester/index.js');
var Gosquared = require('../lib/integrations/gosquared-node/index.js');

describe('GoSquared', function() {
    var analytics;
    var goSquared;
    var options = {
        api_key: 'x'
    };

    beforeEach(function() {
        analytics = new Analytics();
        goSquared = new Gosquared(options);
        analytics.use(Gosquared);
        analytics.use(tester);
        analytics.add(goSquared);
    });

    afterEach(function() {
        analytics.restore();
        analytics.reset();
        goSquared.reset();
    });

    it('should have the right settings', function() {
        analytics.compare(Gosquared, integration('Gosquared')
            .global('gosquared')
            .option('api_key', '')
            .option('site_token', ''));
    });

    describe('before loading', function() {
        beforeEach(function() {
            analytics.stub(goSquared, 'load');
        });

        describe('#initialize', function() {
            it('should initialize the gosquared', function() {
                analytics.assert(!global.gosquared);
                analytics.initialize();
                analytics.assert(global.gosquared);
            });
        });
    });

    describe('after loading', function() {
        beforeEach(function() {
            analytics.initialize();
        });

        describe('#identify', function() {
            beforeEach(function() {
                analytics.stub(global.gosquared, 'createPerson');
                analytics.stub(global.gosquared, 'identify');
            });

            it('should set an id', function() {
                analytics.identify('id');
                analytics.called(global.gosquared.createPerson, 'id');
            });
        });

        describe('#track', function() {
            beforeEach(function() {
                analytics.stub(global.gosquared, 'track');
                analytics.stub(global.gosquared, 'trackEvent');
            });

            it('should send an event', function() {
                analytics.track('event');
                analytics.called(global.gosquared.trackEvent, 'event');
            });

            it('should send an event and properties', function() {
                analytics.track('event', { property: true });
                analytics.called(global.gosquared.trackEvent);
            });
        });

    });
});
