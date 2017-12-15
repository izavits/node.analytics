var Analytics = require('../lib/core/index.js').constructor;
var Facade = require('segmentio-facade');
var analytics = require('../lib/core/index.js');
var assert = require('proclaim');
var createIntegration = require('../lib/integration/index.js');
var extend = require('@ndhoule/extend');
var type = require('component-type');
var sinon = require('sinon');
var tick = require('next-tick');

var Identify = Facade.Identify;
var group = analytics.group();
var store = Analytics.store;
var user = analytics.user();

describe('Analytics', function () {
    var analytics;
    var Test;
    var settings;

    beforeEach(function () {
        settings = {
            Test: {
                key: 'key'
            }
        };
    });
    beforeEach(function () {
        analytics = new Analytics();
        analytics.timeout(0);
        Test = createIntegration('Test');
    });

    afterEach(function () {
        user.reset();
        group.reset();
        user.anonymousId(null);
    });

    it('should setup an Integrations object', function () {
        assert(type(analytics.Integrations) === 'object');
    });

    it('should setup an _integrations object', function () {
        assert(type(analytics._integrations) === 'object');
    });

    it('should set a _readied state', function () {
        assert(analytics._readied === false);
    });

    it('should set a default timeout', function () {
        analytics = new Analytics();
        assert(analytics._timeout === 300);
    });

    it('should set the _user', function () {
        assert(analytics._user === user);
    });

    describe('#use', function () {
        it('should work', function (done) {
            analytics.use(function (singleton) {
                assert(analytics === singleton);
                done();
            });
        });
    });

    describe('#addIntegration', function () {
        it('should add an integration', function () {
            analytics.addIntegration(Test);
            assert(analytics.Integrations.Test === Test);
        });
    });

    describe('#setAnonymousId', function () {
        it('should set the user\'s anonymous id', function () {
            var prev = analytics.user().anonymousId();
            assert(prev.length === 36);
            analytics.setAnonymousId('new-id');
            var curr = analytics.user().anonymousId();
            assert(curr === 'new-id');
        });
    });

    describe('#initialize', function () {
        beforeEach(function () {
            sinon.spy(user, 'load');
            sinon.spy(group, 'load');
        });

        afterEach(function () {
            user.load.restore();
            group.load.restore();
        });

        it('should not error without settings', function () {
            analytics.initialize();
        });

        it('should set options', function () {
            analytics._options = sinon.spy();
            analytics.initialize({}, { option: true });
            assert(analytics._options.calledWith({ option: true }));
        });

        it('should reset analytics._readied to false', function () {
            analytics.addIntegration(Test);
            analytics._readied = true;
            analytics.initialize(settings);
            assert(!analytics._readied);
        });

        it('should add integration instance', function (done) {
            Test.readyOnInitialize();
            analytics.addIntegration(Test);
            analytics.ready(done);
            var test = new Test(settings.Test);
            analytics.add(test);
            analytics.initialize();
        });

        it('should set `.analytics` to self on integration', function (done) {
            Test.readyOnInitialize();
            analytics.addIntegration(Test);
            analytics.ready(done);
            var test = new Test(settings.Test);
            analytics.add(test);
            analytics.initialize();
            assert(test.analytics === analytics);
        });

        it('should listen on integration ready events', function (done) {
            Test.readyOnInitialize();
            analytics.addIntegration(Test);
            analytics.ready(done);
            analytics.initialize(settings);
        });

        it('should still call ready with unknown integrations', function (done) {
            analytics.ready(done);
            analytics.initialize({ Unknown: { key: 'key' } });
        });

        it('should set analytics._readied to true', function (done) {
            analytics.ready(function () {
                assert(analytics._readied);
                done();
            });
            analytics.initialize();
        });

        it('should call #load on the user', function () {
            analytics.initialize();
            assert(user.load.called);
        });

        it('should call #load on the group', function () {
            analytics.initialize();
            assert(group.load.called);
        });

        it('should store enabled integrations', function (done) {
            Test.readyOnInitialize();
            analytics.addIntegration(Test);
            analytics.ready(function () {
                assert(analytics._integrations.Test instanceof Test);
                done();
            });
            analytics.initialize(settings);
        });

        it('should send settings to an integration', function (done) {
            Test = function (options) {
                assert.deepEqual(settings.Test, options);
                done();
            };
            Test.prototype.name = 'Test';
            Test.prototype.once = Test.prototype.initialize = function () {
            };
            analytics.addIntegration(Test);
            analytics.initialize(settings);
        });

        it('should set initialized state', function () {
            analytics.initialize();
            assert(analytics.initialized);
        });

        it('should emit initialize', function (done) {
            analytics.once('initialize', function () {
                done();
            });
            analytics.initialize();
        });
    });

    describe('#ready', function () {
        it('should push a handler on to the queue', function (done) {
            analytics.ready(done);
            analytics.emit('ready');
        });

        it('should callback on next tick when already ready', function (done) {
            analytics.ready(function () {
                var spy = sinon.spy();
                analytics.ready(spy);
                assert(!spy.called);
                tick(function () {
                    assert(spy.called);
                    done();
                });
            });
            analytics.initialize();
        });

        it('should emit ready', function (done) {
            analytics.once('ready', done);
            analytics.initialize();
        });

        it('should not error when passed a non-function', function () {
            analytics.ready('callback');
        });
    });

    describe('#_invoke', function () {
        beforeEach(function (done) {
            Test.readyOnInitialize();
            Test.prototype.invoke = sinon.spy();
            analytics.addIntegration(Test);
            analytics.ready(done);
            analytics.initialize(settings);
        });

        it('should invoke a method on integration with facade', function () {
            var a = new Identify({ userId: 'id', traits: { trait: true } });
            analytics._invoke('identify', a);
            var b = Test.prototype.invoke.args[0][1];
            assert(b === a);
            assert(b.userId() === 'id');
            assert(b.traits().trait === true);
        });

        it('shouldnt call a method when the `all` option is false', function () {
            var opts = { providers: { all: false } };
            var facade = new Facade({ options: opts });
            analytics._invoke('identify', facade);
            assert(!Test.prototype.invoke.called);
        });

        it('shouldnt call a method when the integration option is false', function () {
            var opts = { providers: { Test: false } };
            var facade = new Facade({ options: opts });
            analytics._invoke('identify', facade);
            assert(!Test.prototype.invoke.called);
        });

        it('should support .integrations to disable / select integrations', function () {
            var opts = { integrations: { Test: false } };
            analytics.identify('123', {}, opts);
            assert(!Test.prototype.invoke.called);
        });

        it('should emit "invoke" with facade', function (done) {
            var opts = { All: false };
            var identify = new Identify({ options: opts });
            analytics.on('invoke', function (msg) {
                assert(msg === identify);
                assert(msg.action() === 'identify');
                done();
            });
            analytics._invoke('identify', identify);
        });
    });

    describe('#_options', function () {
        beforeEach(function () {
            sinon.stub(user, 'options');
            sinon.stub(group, 'options');
        });

        afterEach(function () {
            user.options.restore();
            group.options.restore();
        });

        it('should set user options', function () {
            analytics._options({ user: { option: true } });
            assert(user.options.calledWith({ option: true }));
        });

        it('should set group options', function () {
            analytics._options({ group: { option: true } });
            assert(group.options.calledWith({ option: true }));
        });
    });

    describe('#_timeout', function () {
        it('should set the timeout for callbacks', function () {
            analytics.timeout(500);
            assert(analytics._timeout === 500);
        });
    });

    describe('#_callback', function () {
        it('should callback after a timeout', function (done) {
            var spy = sinon.spy();
            analytics._callback(spy);
            assert(!spy.called);
            tick(function () {
                assert(spy.called);
                done();
            });
        });
    });

    describe('#identify', function () {
        beforeEach(function () {
            sinon.spy(analytics, '_invoke');
            sinon.spy(user, 'identify');
        });

        afterEach(function () {
            user.identify.restore();
        });

        it('should call #_invoke', function () {
            analytics.identify();
            assert(analytics._invoke.calledWith('identify'));
        });

        it('should default .anonymousId', function () {
            analytics.identify('user-id');
            var msg = analytics._invoke.args[0][1];
            assert(msg.anonymousId().length === 36);
        });

        it('should override .anonymousId', function () {
            analytics.identify('user-id', {}, { anonymousId: 'anon-id' });
            var msg = analytics._invoke.args[0][1];
            assert(msg.anonymousId() === 'anon-id');
        });

        it('should call #_invoke with Identify', function () {
            analytics.identify();
            var identify = analytics._invoke.getCall(0).args[1];
            assert(identify.action() === 'identify');
        });

        it('should accept (id, traits, options, callback)', function (done) {
            analytics.identify('id', {}, {}, function () {
                var identify = analytics._invoke.getCall(0).args[1];
                assert(identify.userId() === 'id');
                assert(typeof identify.traits() === 'object');
                assert(typeof identify.options() === 'object');
                done();
            });
        });

        it('should accept (id, traits, callback)', function (done) {
            analytics.identify('id', { trait: true }, function () {
                var identify = analytics._invoke.getCall(0).args[1];
                assert(identify.userId() === 'id');
                assert(typeof identify.traits() === 'object');
                done();
            });
        });

        it('should accept (id, callback)', function (done) {
            analytics.identify('id', function () {
                var identify = analytics._invoke.getCall(0).args[1];
                assert(identify.action() === 'identify');
                assert(identify.userId() === 'id');
                done();
            });
        });

        it('should accept (traits, options, callback)', function (done) {
            analytics.identify({}, {}, function () {
                var identify = analytics._invoke.getCall(0).args[1];
                assert(typeof identify.traits() === 'object');
                assert(typeof identify.options() === 'object');
                done();
            });
        });

        it('should accept (traits, callback)', function (done) {
            analytics.identify({}, function () {
                var identify = analytics._invoke.getCall(0).args[1];
                assert(typeof identify.traits() === 'object');
                done();
            });
        });

        it('should identify the user', function () {
            analytics.identify('id', { trait: true });
            assert(user.identify.calledWith('id', { trait: true }));
        });

        it('should emit identify', function (done) {
            analytics.once('identify', function (id, traits, options) {
                assert(id === 'id');
                assert.deepEqual(traits, { a: 1 });
                assert.deepEqual(options, { b: 2 });
                done();
            });
            analytics.identify('id', { a: 1 }, { b: 2 });
        });

        it('should parse a created string into a date', function () {
            var date = new Date();
            var string = date.getTime().toString();
            analytics.identify({ created: string });
            var created = analytics._invoke.args[0][1].created();
            assert(type(created) === 'date');
            assert(created.getTime() === date.getTime());
        });

        it('should parse created milliseconds into a date', function () {
            var date = new Date();
            var milliseconds = date.getTime();
            analytics.identify({ created: milliseconds });
            var created = analytics._invoke.args[0][1].created();
            assert(type(created) === 'date');
            assert(created.getTime() === milliseconds);
        });

        it('should parse created seconds into a date', function () {
            var date = new Date();
            var seconds = Math.floor(date.getTime() / 1000);
            analytics.identify({ created: seconds });
            var identify = analytics._invoke.args[0][1];
            var created = identify.created();
            assert(type(created) === 'date');
            assert(created.getTime() === seconds * 1000);
        });

        it('should parse a company created string into a date', function () {
            var date = new Date();
            var string = date.getTime() + '';
            analytics.identify({ company: { created: string } });
            var identify = analytics._invoke.args[0][1];
            var created = identify.companyCreated();
            assert(type(created) === 'date');
            assert(created.getTime() === date.getTime());
        });

        it('should parse company created milliseconds into a date', function () {
            var date = new Date();
            var milliseconds = date.getTime();
            analytics.identify({ company: { created: milliseconds } });
            var identify = analytics._invoke.args[0][1];
            var created = identify.companyCreated();
            assert(type(created) === 'date');
            assert(created.getTime() === milliseconds);
        });

        it('should parse company created seconds into a date', function () {
            var date = new Date();
            var seconds = Math.floor(date.getTime() / 1000);
            analytics.identify({ company: { created: seconds } });
            var identify = analytics._invoke.args[0][1];
            var created = identify.companyCreated();
            assert(type(created) === 'date');
            assert(created.getTime() === seconds * 1000);
        });

        it('should accept top level option .timestamp', function () {
            var date = new Date();
            analytics.identify(1, { trait: true }, { timestamp: date });
            var identify = analytics._invoke.args[0][1];
            assert.deepEqual(identify.timestamp(), date);
        });

        it('should accept top level option .integrations', function () {
            analytics.identify(1, { trait: true }, { integrations: { AdRoll: { opt: true } } });
            var identify = analytics._invoke.args[0][1];
            assert.deepEqual({ opt: true }, identify.options('AdRoll'));
        });

        it('should accept top level option .context', function () {
            analytics.identify(1, { trait: true }, { context: { app: { name: 'segment' } } });
            var identify = analytics._invoke.args[0][1];
            assert.deepEqual(identify.obj.context.app, { name: 'segment' });
        });
    });

    describe('#user', function () {
        it('should return the user singleton', function () {
            assert(analytics.user() === user);
        });
    });

    describe('#group', function () {
        beforeEach(function () {
            sinon.spy(analytics, '_invoke');
            sinon.spy(group, 'identify');
        });

        afterEach(function () {
            group.identify.restore();
        });

        it('should return the group singleton', function () {
            assert(analytics.group() === group);
        });

        it('should call #_invoke', function () {
            analytics.group('id');
            assert(analytics._invoke.calledWith('group'));
        });

        it('should default .anonymousId', function () {
            analytics.group('group-id');
            var msg = analytics._invoke.args[0][1];
            assert(msg.anonymousId().length === 36);
        });

        it('should override .anonymousId', function () {
            analytics.group('group-id', {}, { anonymousId: 'anon-id' });
            var msg = analytics._invoke.args[0][1];
            assert(msg.anonymousId() === 'anon-id');
        });

        it('should call #_invoke with group facade instance', function () {
            analytics.group('id');
            var group = analytics._invoke.args[0][1];
            assert(group.action() === 'group');
        });

        it('should accept (id, properties, options, callback)', function (done) {
            analytics.group('id', {}, {}, function () {
                var group = analytics._invoke.args[0][1];
                assert(group.groupId() === 'id');
                assert(typeof group.properties() === 'object');
                assert(typeof group.options() === 'object');
                done();
            });
        });

        it('should accept (id, properties, callback)', function (done) {
            analytics.group('id', {}, function () {
                var group = analytics._invoke.args[0][1];
                assert(group.groupId() === 'id');
                assert(typeof group.properties() === 'object');
                done();
            });
        });

        it('should accept (id, callback)', function (done) {
            analytics.group('id', function () {
                var group = analytics._invoke.args[0][1];
                assert(group.groupId() === 'id');
                done();
            });
        });

        it('should accept (properties, options, callback)', function (done) {
            analytics.group({}, {}, function () {
                var group = analytics._invoke.args[0][1];
                assert(typeof group.properties() === 'object');
                assert(typeof group.options() === 'object');
                done();
            });
        });

        it('should accept (properties, callback)', function (done) {
            analytics.group({}, function () {
                var group = analytics._invoke.args[0][1];
                assert(typeof group.properties() === 'object');
                done();
            });
        });

        it('should call #identify on the group', function () {
            analytics.group('id', { property: true });
            assert(group.identify.calledWith('id', { property: true }));
        });

        it('should emit group', function (done) {
            analytics.once('group', function (groupId, traits, options) {
                assert(groupId === 'id');
                assert.deepEqual(traits, { a: 1 });
                assert.deepEqual(options, { b: 2 });
                done();
            });
            analytics.group('id', { a: 1 }, { b: 2 });
        });

        it('should parse created milliseconds into a date', function () {
            var date = new Date();
            var milliseconds = date.getTime();
            analytics.group({ created: milliseconds });
            var g = analytics._invoke.args[0][1];
            var created = g.created();
            assert(type(created) === 'date');
            assert(created.getTime() === milliseconds);
        });

        it('should parse created seconds into a date', function () {
            var date = new Date();
            var seconds = Math.floor(date.getTime() / 1000);
            analytics.group({ created: seconds });
            var g = analytics._invoke.args[0][1];
            var created = g.created();
            assert(type(created) === 'date');
            assert(created.getTime() === seconds * 1000);
        });

        it('should accept top level option .timestamp', function () {
            var date = new Date();
            analytics.group(1, { trait: true }, { timestamp: date });
            var group = analytics._invoke.args[0][1];
            assert.deepEqual(group.timestamp(), date);
        });

        it('should accept top level option .integrations', function () {
            analytics.group(1, { trait: true }, { integrations: { AdRoll: { opt: true } } });
            var group = analytics._invoke.args[0][1];
            assert.deepEqual(group.options('AdRoll'), { opt: true });
        });

        it('should accept top level option .context', function () {
            var app = { name: 'segment' };
            analytics.group(1, { trait: true }, { context: { app: app } });
            var group = analytics._invoke.args[0][1];
            assert.deepEqual(group.obj.context.app, app);
        });
    });

    describe('#track', function () {
        beforeEach(function () {
            sinon.spy(analytics, '_invoke');
        });

        it('should call #_invoke', function () {
            analytics.track();
            assert(analytics._invoke.calledWith('track'));
        });

        it('should default .anonymousId', function () {
            analytics.track();
            var msg = analytics._invoke.args[0][1];
            assert(msg.anonymousId().length === 36);
        });

        it('should override .anonymousId', function () {
            analytics.track('event', {}, { anonymousId: 'anon-id' });
            var msg = analytics._invoke.args[0][1];
            assert(msg.anonymousId() === 'anon-id');
        });

        it('should transform arguments into Track', function () {
            analytics.track();
            var track = analytics._invoke.getCall(0).args[1];
            assert(track.action() === 'track');
        });

        it('should accept (event, properties, options, callback)', function (done) {
            analytics.track('event', {}, {}, function () {
                var track = analytics._invoke.args[0][1];
                assert(track.event() === 'event');
                assert(typeof track.properties() === 'object');
                assert(typeof track.options() === 'object');
                done();
            });
        });

        it('should accept (event, properties, callback)', function (done) {
            analytics.track('event', {}, function () {
                var track = analytics._invoke.args[0][1];
                assert(track.event() === 'event');
                assert(typeof track.properties() === 'object');
                done();
            });
        });

        it('should accept (event, callback)', function (done) {
            analytics.track('event', function () {
                var track = analytics._invoke.args[0][1];
                assert(track.event() === 'event');
                done();
            });
        });

        it('should emit track', function (done) {
            analytics.once('track', function (event, properties, options) {
                assert(event === 'event');
                assert.deepEqual(properties, { a: 1 });
                assert.deepEqual(options, { b: 2 });
                done();
            });
            analytics.track('event', { a: 1 }, { b: 2 });
        });

        it('should safely convert ISO dates to date objects', function () {
            var date = new Date(Date.UTC(2013, 9, 5));
            analytics.track('event', {
                date: '2013-10-05T00:00:00.000Z',
                nonDate: '2013'
            });
            var track = analytics._invoke.args[0][1];
            assert(track.properties().date.getTime() === date.getTime());
            assert(track.properties().nonDate === '2013');
        });

        it('should accept top level option .timestamp', function () {
            var date = new Date();
            analytics.track('event', { prop: true }, { timestamp: date });
            var track = analytics._invoke.args[0][1];
            assert.deepEqual(date, track.timestamp());
        });

        it('should accept top level option .integrations', function () {
            analytics.track('event', { prop: true }, { integrations: { AdRoll: { opt: true } } });
            var track = analytics._invoke.args[0][1];
            assert.deepEqual({ opt: true }, track.options('AdRoll'));
        });

        it('should accept top level option .context', function () {
            var app = { name: 'segment' };
            analytics.track('event', { prop: true }, { context: { app: app } });
            var track = analytics._invoke.args[0][1];
            assert.deepEqual(app, track.obj.context.app);
        });

        it('should not call #_invoke if the event is disabled', function () {
            analytics.options.plan = {
                track: {
                    event: { enabled: false }
                }
            };
            analytics.track('event');
            assert(!analytics._invoke.called);
        });

        it('should call #_invoke if the event is enabled', function () {
            analytics.options.plan = {
                track: {
                    event: { enabled: true }
                }
            };
            analytics.track('event');
            assert(analytics._invoke.called);
        });

        it('should call the callback even if the event is disabled', function (done) {
            analytics.options.plan = {
                track: {
                    event: { enabled: false }
                }
            };
            assert(!analytics._invoke.called);
            analytics.track('event', {}, {}, function () {
                done();
            });
        });

        it('should default .integrations to plan.integrations', function () {
            analytics.options.plan = {
                track: {
                    event: {
                        integrations: { All: true }
                    }
                }
            };

            analytics.track('event', {}, { integrations: { Segment: true } });
            var msg = analytics._invoke.args[0][1];
            assert(msg.event() === 'event');
            assert.deepEqual(msg.integrations(), { All: true, Segment: true });
        });

        it('should not set ctx.integrations if plan.integrations is empty', function () {
            analytics.options.plan = { track: { event: {} } };
            analytics.track('event', {}, { campaign: {} });
            var msg = analytics._invoke.args[0][1];
            assert.deepEqual({}, msg.proxy('context.campaign'));
        });
    });

    describe('#alias', function () {
        beforeEach(function () {
            sinon.spy(analytics, '_invoke');
        });

        it('should call #_invoke', function () {
            analytics.alias();
            assert(analytics._invoke.calledWith('alias'));
        });

        it('should call #_invoke with instanceof Alias', function () {
            analytics.alias();
            var alias = analytics._invoke.args[0][1];
            assert(alias.action() === 'alias');
        });

        it('should default .anonymousId', function () {
            analytics.alias('previous-id', 'user-id');
            var msg = analytics._invoke.args[0][1];
            assert(msg.anonymousId().length === 36);
        });

        it('should override .anonymousId', function () {
            analytics.alias('previous-id', 'user-id', { anonymousId: 'anon-id' });
            var msg = analytics._invoke.args[0][1];
            assert(msg.anonymousId() === 'anon-id');
        });

        it('should accept (new, old, options, callback)', function (done) {
            analytics.alias('new', 'old', {}, function () {
                var alias = analytics._invoke.args[0][1];
                assert(alias.from() === 'old');
                assert(alias.to() === 'new');
                assert(typeof alias.options() === 'object');
                done();
            });
        });

        it('should accept (new, old, callback)', function (done) {
            analytics.alias('new', 'old', function () {
                var alias = analytics._invoke.args[0][1];
                assert(alias.from() === 'old');
                assert(alias.to() === 'new');
                assert(typeof alias.options() === 'object');
                done();
            });
        });

        it('should accept (new, callback)', function (done) {
            analytics.alias('new', function () {
                var alias = analytics._invoke.args[0][1];
                assert(alias.to() === 'new');
                assert(typeof alias.options() === 'object');
                done();
            });
        });

        it('should emit alias', function (done) {
            analytics.once('alias', function (newId, oldId, options) {
                assert(newId === 'new');
                assert(oldId === 'old');
                assert.deepEqual(options, { opt: true });
                done();
            });
            analytics.alias('new', 'old', { opt: true });
        });
    });

    describe('#push', function () {
        beforeEach(function () {
            analytics.track = sinon.spy();
        });

        it('should call methods with args', function () {
            analytics.push(['track', 'event', { prop: true }]);
            assert(analytics.track.calledWith('event', { prop: true }));
        });
    });

    describe('#reset', function () {
        beforeEach(function () {
            user.id('user-id');
            user.traits({ name: 'John Doe' });
            group.id('group-id');
            group.traits({ name: 'Example' });
        });

        it('should remove persisted group and user', function () {
            assert(user.id() === 'user-id');
            assert(user.traits().name === 'John Doe');
            assert(group.id() === 'group-id');
            assert(group.traits().name === 'Example');
            analytics.reset();
            assert(user.id() === null);
            assert.deepEqual({}, user.traits());
            assert(group.id() === null);
            assert.deepEqual({}, group.traits());
        });
    });

    describe('#anonymize', function () {
        it('should hide absolute paths', function () {
            var obj = {
                path1: '/home/john/rpi.img',
                simpleProperty: null,
                nested: {
                    path2: '/home/john/another-image.img',
                    path3: 'yet-another-image.img',
                    otherProperty: false
                }
            };
            var anon = analytics.anonymize(obj);
            assert(anon.path1 === 'rpi.img');
            assert(anon.simpleProperty === null);
            assert(anon.nested.path2 === 'another-image.img');
            assert(anon.nested.path3 === 'yet-another-image.img');
            assert(anon.nested.otherProperty === false);
        });
    });
});