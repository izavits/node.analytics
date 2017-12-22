var Analytics = require('../lib/core/index.js').constructor;
var integration = require('../lib/integration/index.js');
var tester = require('../lib/integration-tester/index.js');
var Sentry = require('../lib/integrations/sentry-node/index.js');

describe('Sentry-node', function () {
    var sentry;
    var analytics;
    var options = {
        // random settings - do not correspond to real project
        config: 'https://123456789@app.getsentry.com/52723',
        release: '1',
        serverName: 'test',
        captureUnhandledRejections: true,
        disableConsoleAlerts: true
    };

    beforeEach(function () {
        analytics = new Analytics();
        sentry = new Sentry(options);
        analytics.use(Sentry);
        analytics.use(tester);
        analytics.add(sentry);
    });

    afterEach(function () {
        analytics.restore();
        analytics.reset();
        sentry.reset();
    });

    it('should have the right settings', function () {
        analytics.compare(Sentry, integration('Sentry')
            .global('sentry')
            .option('config', '')
            .option('serverName', null)
            .option('release', null)
            .option('captureUnhandledRejections', true)
            .option('disableConsoleAlerts', true));
    });

    describe('before loading', function () {
        beforeEach(function () {
            analytics.stub(sentry, 'load');
        });

        describe('#initialize', function () {
            it('should create global.sentry', function () {
                analytics.assert(!global.sentry);
                analytics.initialize();
                analytics.assert(global.sentry);
            });

            it('should respect the settings', function () {
                analytics.initialize();
                analytics.assert(global.sentry.raw_dsn === options.config);
                analytics.assert(global.sentry.release, options.release);
            });

            it('should reject null settings', function () {
                sentry.options.release = null;
                analytics.initialize();
                analytics.assert(!global.sentry.release);
            });

            it('should reject empty settings', function () {
                sentry.options.release = '';
                analytics.initialize();
                analytics.assert(!global.sentry.release);
            });
        });
    });

    describe('after loading', function () {
        beforeEach(function () {
            analytics.initialize();
        });

        describe('#identify', function () {
            beforeEach(function () {
                analytics.stub(global.sentry, 'identify');
                analytics.stub(global.sentry, 'setContext');
            });

            it('should send an id', function () {
                analytics.identify('id');
                analytics.called(global.sentry.setContext, { id: 'id' });
            });

            it('should send traits', function () {
                analytics.identify({ trait: true });
                analytics.called(global.sentry.setContext, { trait: true });
            });

            it('should send an id and traits', function () {
                analytics.identify('id', { trait: true });
                analytics.called(global.sentry.setContext, { id: 'id', trait: true });
            });
        });

        describe('#associate Context', function () {
            beforeEach(function () {
                analytics.stub(global.sentry, 'identify');
                analytics.stub(global.sentry, 'setContext');
                analytics.stub(global.sentry, 'mergeContext');
            });

            it('should send an id in setContext', function () {
                analytics.setContext({ id: 'id' });
                analytics.called(global.sentry.setContext, { id: 'id' });
            });

            it('should send an id in mergeContext', function () {
                analytics.mergeContext({ id: 'id' });
                analytics.called(global.sentry.mergeContext, { id: 'id' });
            });

            it('should send traits in setContext', function () {
                analytics.setContext({ trait: true });
                analytics.called(global.sentry.setContext, { trait: true });
            });

            it('should send traits in mergeContext', function () {
                analytics.mergeContext({ trait: true });
                analytics.called(global.sentry.mergeContext, { trait: true });
            });

            it('should send an id and traits in setContext', function () {
                analytics.setContext({ id: 'id',  trait: true });
                analytics.called(global.sentry.setContext, { id: 'id', trait: true });
            });

            it('should send an id and traits in mergeContext', function () {
                analytics.mergeContext({ id: 'id',  trait: true });
                analytics.called(global.sentry.mergeContext, { id: 'id', trait: true });
            });

        });

        describe('#captureException', function () {
            beforeEach(function () {
                analytics.stub(global.sentry, 'captureException');
            });

            it('should send an exception', function () {
                try {
                    throw new Error('Whoops!');
                }
                catch (e) {
                    analytics.captureException(e);
                    analytics.called(global.sentry.captureException);
                }
            });
        });
    });
});
