var Analytics = require('../lib/core/index.js').constructor;
var integration = require('../lib/integration/index.js');
var iso = require('@segment/to-iso-string');
var stub = require('@segment/stub');
var tester = require('../lib/integration-tester/index.js');
var assert = require('proclaim');
var sinon = require('sinon');
var Mixpanel = require('../lib/integrations/mixpanel-node/index.js');

describe('Mixpanel-node', function () {
    var analytics;
    var mixpanel;
    var options = {
        token: 'x'
    };

    beforeEach(function () {
        analytics = new Analytics();
        mixpanel = new Mixpanel(options);
        analytics.use(Mixpanel);
        analytics.use(tester);
        analytics.add(mixpanel);
    });

    afterEach(function () {
        analytics.restore();
        analytics.reset();
        mixpanel.reset();
    });

    it('should have the right settings', function () {
        analytics.compare(Mixpanel, integration('Mixpanel')
            .global('mixpanel')
            .option('token', '')
            .option('people', true));
    });

    describe('before loading', function () {
        beforeEach(function () {
            analytics.stub(mixpanel, 'load');
        });

        describe('#initialize', function () {
            it('should create global.mixpanel', function () {
                analytics.assert(!global.mixpanel);
                analytics.initialize();
                analytics.assert(global.mixpanel);
            });
        });
    });

    describe('after loading', function () {
        beforeEach(function () {
            analytics.initialize();
        });
        describe('#identify', function () {
            beforeEach(function () {
                analytics.stub(global.mixpanel, 'identify');
                analytics.stub(global.mixpanel.people, 'set');
            });

            it('should send an id', function () {
                analytics.identify('id');
                analytics.called(global.mixpanel.people.set, 'id');
            });

            it('should send traits to Mixpanel People', function () {
                mixpanel.options.people = true;
                analytics.identify({ trait: true });
                analytics.called(global.mixpanel.people.set, null, { trait: true });
            });

            it('should set people properties from the mixpanel.options.peopleProperties object if setAllTraitsByDefault is false', function () {
                mixpanel.options.people = true;
                mixpanel.options.setAllTraitsByDefault = false;
                mixpanel.options.peopleProperties = ['friend'];
                analytics.identify(123, { friend: 'elmo'});
                analytics.called(global.mixpanel.people.set, 123, { friend: 'elmo', id: 123 });
            });

            it('should set people properties from the Mixpanel\'s special traits if setAllTraitsByDefault is false and the property isn\'t on the call', function () {
                mixpanel.options.people = true;
                mixpanel.options.setAllTraitsByDefault = false;
                mixpanel.options.peopleProperties = ['friend'];
                analytics.identify(123, { friend: 'elmo', email: 'dog@dog.com' });
                analytics.called(global.mixpanel.people.set, 123, { friend: 'elmo', $email: 'dog@dog.com', id: 123 });
            });

            it('should alias traits to Mixpanel People', function () {
                mixpanel.options.people = true;
                var date = new Date();
                analytics.identify({
                    created: date,
                    email: 'name@example.com',
                    firstName: 'first',
                    lastName: 'last',
                    lastSeen: date,
                    name: 'name',
                    username: 'username',
                    phone: 'phone'
                });
                analytics.called(global.mixpanel.people.set, null, {
                    $created: date,
                    $email: 'name@example.com',
                    $first_name: 'first',
                    $last_name: 'last',
                    $last_seen: date,
                    $name: 'name',
                    $username: 'username',
                    $phone: 'phone'
                });
            });

            it('should remove .created', function () {
                mixpanel.options.people = true;
                var date = new Date();
                analytics.identify({
                    created: date,
                    email: 'name@example.com',
                    firstName: 'first',
                    lastName: 'last',
                    lastSeen: date,
                    name: 'name',
                    username: 'username',
                    phone: 'phone'
                });
                analytics.called(global.mixpanel.people.set, null, {
                    $created: date,
                    $email: 'name@example.com',
                    $first_name: 'first',
                    $last_name: 'last',
                    $last_seen: date,
                    $name: 'name',
                    $username: 'username',
                    $phone: 'phone'
                });
            });
        });

        describe('#track', function () {
            beforeEach(function () {
                analytics.stub(global.mixpanel, 'track');
                analytics.stub(global.mixpanel.people, 'increment');
                analytics.stub(global.mixpanel.people, 'set');
                analytics.stub(global.mixpanel.people, 'track_charge');
            });

            it('should send an event', function () {
                analytics.track('event');
                analytics.called(global.mixpanel.track, 'event');
            });

            it('should send an event and properties', function () {
                analytics.track('event', { property: true });
                analytics.called(global.mixpanel.track, 'event', { property: true });
            });

            it('should send a revenue property to Mixpanel People', function () {
                mixpanel.options.people = true;
                analytics.track('event', { revenue: 9.99 });
                analytics.called(global.mixpanel.people.track_charge, 9.99);
            });

            it('should not set people properties from the mixpanl.options.peopleProperties object', function () {
                mixpanel.options.people = true;
                mixpanel.options.peopleProperties = ['friend'];
                analytics.track('event', { friend: 'elmo' });
                analytics.didNotCall(global.mixpanel.people.set);
            });

            it('should not set people properties from the Mixpanel\'s special traits', function () {
                mixpanel.options.people = true;
                mixpanel.options.peopleProperties = ['friend'];
                analytics.track('event', { friend: 'elmo', email: 'dog@dog.com' });
                analytics.didNotCall(global.mixpanel.people.set);
            });

            it('should convert dates to iso strings', function () {
                var date = new Date();
                analytics.track('event', { date: date });
                analytics.called(global.mixpanel.track, 'event', { date: iso(date) });
            });

            it('should increment events that are in .increments option', function () {
                mixpanel.options.increments = [0, 'my event', 1];
                mixpanel.options.people = true;
                analytics.track('my event');
                analytics.called(global.mixpanel.people.increment, 'my event');
            });

            it('should should update people property if the event is in .increments', function () {
                mixpanel.options.increments = ['event'];
                mixpanel.options.people = true;
                analytics.track('event');
                var date = global.mixpanel.people.set.args[0][1];
                analytics.assert(date.getTime() === new Date().getTime());
                analytics.called(global.mixpanel.people.increment, 'event');
                analytics.called(global.mixpanel.people.set, 'Last event', date);
            });

            it('should not convert arrays of simple types', function () {
                analytics.track('event', { array: ['a', 'b', 'c'] });
                analytics.called(global.mixpanel.track, 'event', { array: ['a', 'b', 'c'] });
                analytics.track('event', { array: [13, 28, 99] });
                analytics.called(global.mixpanel.track, 'event', { array: [13, 28, 99] });
            });
        });

        describe('#alias', function () {
            beforeEach(function () {
                analytics.stub(global.mixpanel, 'alias');
            });

            it('should send a new id', function () {
                analytics.alias('new');
                analytics.called(global.mixpanel.alias, 'new');
            });

            it('should send a new and old id', function () {
                analytics.alias('new', 'old');
                analytics.called(global.mixpanel.alias, 'new', 'old');
            });
        });

    });
});