var assert = require('proclaim');
var sinon = require('sinon');
var analytics = require('../lib/core/index.js');
var Analytics = require('../lib/core/index.js').constructor;
var memory = Analytics.memory;
var user = analytics.user();
var User = user.User;

describe('user', function () {
    var localStorageKey = user._options.localStorage.key;

    beforeEach(function () {
        user = new User();
        user.reset();
    });

    afterEach(function () {
        user.reset();
    });

    describe('()', function () {
        it('should create anonymous id if missing', function () {
            var user = new User();
            assert(user.anonymousId().length === 36);
        });
    });

    describe('#id', function () {
        describe('when cookies are disabled', function () {
            beforeEach(function () {
                user = new User();
            });

            it('should get an id when not persisting', function () {
                user.options({ persist: false });
                user._id = 'id';
                assert(user.id() === 'id');
            });

            it('should set the id when not persisting', function () {
                user.options({ persist: false });
                user.id('id');
                assert(user._id === 'id');
            });

            it('should be null by default', function () {
                assert(user.id() === null);
            });

            it('should not reset anonymousId if the user didnt have previous id', function () {
                var prev = user.anonymousId();
                user.id('foo');
                user.id('foo');
                user.id('foo');
                assert(user.anonymousId() === prev);
            });

            it('should reset anonymousId if the user id changed', function () {
                var prev = user.anonymousId();
                user.id('foo');
                user.id('baz');
                assert(user.anonymousId() !== prev);
                assert(user.anonymousId().length === 36);
            });

            it('should not reset anonymousId if the user id changed to null', function () {
                var prev = user.anonymousId();
                user.id('foo');
                user.id(null);
                assert(user.anonymousId() === prev);
                assert(user.anonymousId().length === 36);
            });
        });
    });

    describe('#anonymousId', function () {
        var noop = { set: function () {
        }, get: function () {
        } };
        var storage = user.storage;

        afterEach(function () {
            user.storage = storage;
        });

        describe('when cookies and localStorage are disabled', function () {
            beforeEach(function () {
                user = new User();
            });

            it('should get an id from the memory', function () {
                memory.set('ajs_anonymous_id', 'anon-id');
                assert(user.anonymousId() === 'anon-id');
            });

            it('should set an id to the memory', function () {
                user.anonymousId('anon-id');
                assert(memory.get('ajs_anonymous_id') === 'anon-id');
            });

            it('should return anonymousId using the store', function () {
                user.storage = function () {
                    return noop;
                };
                assert(user.anonymousId() === undefined);
            });
        });

    });

    describe('#traits', function () {
        it('should get traits when not persisting', function () {
            user.options({ persist: false });
            user._traits = { trait: true };
            assert.deepEqual(user.traits(), { trait: true });
        });

        it('should get a copy of traits when not persisting', function () {
            user.options({ persist: false });
            user._traits = { trait: true };
            assert(user.traits() !== user._traits);
        });

        it('should set the id when not persisting', function () {
            user.options({ persist: false });
            user.traits({ trait: true });
            assert.deepEqual(user._traits, { trait: true });
        });

        it('should default traits to an empty object', function () {
            user.traits(null);
            assert.deepEqual(user._traits, {});
        });

        it('should default traits to an empty object when not persisting', function () {
            user.options({ persist: false });
            user.traits(null);
            assert.deepEqual(user._traits, {});
        });

        it('should be an empty object by default', function () {
            assert.deepEqual(user.traits(), {});
        });
    });

    describe('#options', function () {
        it('should get options', function () {
            assert(user.options() === user._options);
        });

        it('should set options with defaults', function () {
            user.options({ option: true });
            assert.deepEqual(user._options, {
                option: true,
                persist: true,
                localStorage: {
                    key: 'ajs_user_traits'
                }
            });
        });
    });

    describe('#logout', function () {
        it('should reset an id and traits', function () {
            user.id('id');
            user.anonymousId('anon-id');
            user.traits({ trait: true });
            user.logout();
            assert(user.id() === null);
            assert(user.traits(), {});
        });

    });

    describe('#identify', function () {
        it('should save an id', function () {
            user.identify('id');
            assert(user.id() === 'id');
        });

        it('should save traits', function () {
            user.identify(null, { trait: true });
            assert.deepEqual(user.traits(), { trait: true });
        });

        it('should save an id and traits', function () {
            user.identify('id', { trait: true });
            assert(user.id() === 'id');
            assert.deepEqual(user.traits(), { trait: true });
        });

        it('should extend existing traits', function () {
            user.traits({ one: 1 });
            user.identify('id', { two: 2 });
            assert.deepEqual(user.traits(), { one: 1, two: 2 });
        });

        it('shouldnt extend existing traits for a new id', function () {
            user.id('id');
            user.traits({ one: 1 });
            user.identify('new', { two: 2 });
            assert.deepEqual(user.traits(), { two: 2 });
        });

        it('should reset traits for a new id', function () {
            user.id('id');
            user.traits({ one: 1 });
            user.identify('new');
            assert.deepEqual(user.traits(), {});
        });
    });

    describe('#load', function () {
        it('should load an empty user', function () {
            user.load();
            assert(user.id() === null);
            assert.deepEqual(user.traits(), {});
        });
    });
});