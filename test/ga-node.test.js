var Analytics = require('../lib/core/index.js').constructor;
var integration = require('../lib/integration/index.js');
var tester = require('../lib/integration-tester/index.js');
var GA = require('../lib/integrations/ga-node/index.js');

describe('GoogleAnalytics', function () {
    var analytics;
    var ga;
    var options = {
        propertyId: 'xxxxxx',
        strictCidFormat: false,
        https: true
    };

    beforeEach(function () {
        analytics = new Analytics();
        ga = new GA(options);
        analytics.use(GA);
        analytics.use(tester);
        analytics.add(ga);
    });

    afterEach(function () {
        analytics.restore();
        analytics.reset();
        ga.reset();
    });

    it('should have the right settings', function () {
        analytics.compare(GA, integration('GA')
            .global('ga')
            .option('propertyId', '')
            .option('strictCidFormat', false)
            .option('https', true));
    });

    describe('before loading', function () {
        beforeEach(function () {
            analytics.stub(ga, 'load');
        });

        describe('#initialize', function () {
            it('should initialize the gooogle analytics', function () {
                analytics.assert(!global.ga);
                analytics.initialize();
                analytics.assert(global.ga);
            });
        });
    });

    describe('after loading', function () {
        beforeEach(function () {
            analytics.initialize();
        });

        describe('#identify', function () {
            beforeEach(function () {
                analytics.stub(global.ga, 'identify');
                analytics.stub(global.ga, 'set');
            });

            it('should set an id', function () {
                analytics.identify('id');
                analytics.called(global.ga.set, 'uid', 'id');
            });

            it('should not call identify without an id', function () {
                analytics.identify();
                analytics.didNotCall(global.ga.set);
            });
        });

        describe('#track', function () {
            beforeEach(function () {
                analytics.stub(global.ga, 'track');
                analytics.stub(global.ga, 'event');
            });

            it('should send an event with action and category', function () {
                analytics.track('testAction', {
                    category: 'testCategory'
                });
                analytics.called(global.ga.event, "testCategory",
                    "testAction");
            });

            it('should send an event with action, category and label', function () {
                analytics.track('testAction', {
                    category: 'testCategory',
                    label: 'testEvent'
                });
                analytics.called(global.ga.event, "testCategory",
                    "testAction",
                    "testEvent");
            });

            it('should not send an event with only action', function () {
                analytics.track('testAction', {});
                analytics.didNotCall(global.ga.event);
            });

            it('should not send an event with only category', function () {
                analytics.track({category: 'testCategory'});
                analytics.didNotCall(global.ga.event);
            });

            it('should not send an event with only label', function () {
                analytics.track({label: 'testEvent'});
                analytics.didNotCall(global.ga.event);
            });

            it('should not send an empty event', function () {
                analytics.track({});
                analytics.didNotCall(global.ga.event);
            });
        });
    });
});