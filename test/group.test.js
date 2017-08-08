var Analytics = require('../lib/core/index.js').constructor;
var analytics = require('../lib/core/index.js');
var assert = require('proclaim');
var sinon = require('sinon');
var group = analytics.group();
var Group = group.Group;
var memory = Analytics.memory;

describe('Group', function () {
    var localStorageKey = group._options.localStorage.key;

    beforeEach(function () {
        group = new Group();
        group.reset();
    });

    afterEach(function () {
        group.reset();
    });

    describe('#id', function () {
        describe('when cookies are disabled', function () {
            beforeEach(function () {
                group = new Group();
            });

            it('should get an id when not persisting', function () {
                group.options({ persist: false });
                group._id = 'id';
                assert(group.id() === 'id');
            });

            it('should set the id when not persisting', function () {
                group.options({ persist: false });
                group.id('id');
                assert(group._id === 'id');
            });

            it('should be null by default', function () {
                assert(group.id() === null);
            });
        });

        describe('when cookies and localStorage are disabled', function () {
            beforeEach(function () {
                group = new Group();
            });

            it('should get an id when not persisting', function () {
                group.options({ persist: false });
                group._id = 'id';
                assert(group.id() === 'id');
            });

            it('should set the id when not persisting', function () {
                group.options({ persist: false });
                group.id('id');
                assert(group._id === 'id');
            });

            it('should be null by default', function () {
                assert(group.id() === null);
            });
        });
    });

    describe('#properties', function () {

        it('should get properties when not persisting', function () {
            group.options({ persist: false });
            group._traits = { property: true };
            assert.deepEqual(group.properties(), { property: true });
        });

        it('should get a copy of properties when not persisting', function () {
            group.options({ persist: false });
            group._traits = { property: true };
            assert(group._traits !== group.properties());
        });

        it('should set properties', function () {
            group.properties({ property: true });
            assert.deepEqual(group.properties(), { property: true });
        });

        it('should set the id when not persisting', function () {
            group.options({ persist: false });
            group.properties({ property: true });
            assert.deepEqual(group._traits, { property: true });
        });

        it('should default properties to an empty object', function () {
            group.properties(null);
            assert.deepEqual(group.properties(), {});
        });

        it('should default properties to an empty object when not persisting', function () {
            group.options({ persist: false });
            group.properties(null);
            assert.deepEqual(group._traits, {});
        });

        it('should be an empty object by default', function () {
            assert.deepEqual(group.properties(), {});
        });
    });

    describe('#options', function () {
        it('should get options', function () {
            var options = group.options();
            assert(options === group._options);
        });

        it('should set options with defaults', function () {
            group.options({ option: true });
            assert.deepEqual(group._options,
                { option: true,
                    persist: true,
                    localStorage: { key: 'ajs_group_properties' } })
        });
    });

    describe('#logout', function () {
        it('should reset an id and properties', function () {
            group.id('id');
            group.properties({ property: true });
            group.logout();
            assert(group.id() === null);
            assert.deepEqual(group.properties(), {});
        });
    });

    describe('#identify', function () {
        it('should save an id', function () {
            group.identify('id');
            assert(group.id() === 'id');
        });

        it('should save properties', function () {
            group.identify(null, { property: true });
            assert(group.properties(), { property: true });
        });

        it('should save an id and properties', function () {
            group.identify('id', { property: true });
            assert(group.id() === 'id');
            assert.deepEqual(group.properties(), { property: true });
        });

        it('should extend existing properties', function () {
            group.properties({ one: 1 });
            group.identify('id', { two: 2 });
            assert.deepEqual(group.properties(), { one: 1, two: 2 });
        });

        it('shouldnt extend existing properties for a new id', function () {
            group.id('id');
            group.properties({ one: 1 });
            group.identify('new', { two: 2 });
            assert.deepEqual(group.properties(), { two: 2 });
        });

        it('should reset properties for a new id', function () {
            group.id('id');
            group.properties({ one: 1 });
            group.identify('new');
            assert.deepEqual(group.properties(), {});
        });
    });

    describe('#load', function () {
        it('should load an empty group', function () {
            group.load();
            assert(group.id() === null);
            assert.deepEqual(group.properties(), {});
        });
    });
});