/**
 * Developer: Stepan Burguchev
 * Date: 6/14/2016
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

"use strict";

import Chance from 'chance';
import core from 'coreApi';
import { expectCollectionsToBeEqual, expectToHaveSameMembers } from '../helpers';
import { TaskModel, UserModel, addChanceMixins } from '../testData';

let chance = new Chance();
let repository = addChanceMixins(chance);

describe('Virtual Collection', function () {
    var assigneeGrouping = {
        modelFactory: function (model) {
            return model.get('assignee');
        },
        comparator: function (model) {
            return model.get('assignee').id;
        },
        iterator: function (model) {
            return model.get('assignee').get('name');
        },
        affectedAttributes: [
            'assignee'
        ]
    };

    var originalCollection;
    var virtualCollection;

    function createFixture(list, virtualCollectionOptions, originalCollectionOptions) {
        var options = { model: TaskModel };
        if (originalCollectionOptions) {
            _.extend(options, originalCollectionOptions);
        }
        originalCollection = new Backbone.Collection(list, options);
        virtualCollection = new core.collections.VirtualCollection(originalCollection, virtualCollectionOptions);
        return virtualCollection;
    }

    describe('When grouping tree collection', function ()
    {
        it('should apply comparator to all levels of the tree', function ()
        {
            // Fixture setup and system exercise
            var count = 3;
            var rootTasks = _.times(count, function (n) {
                return new TaskModel(chance.task({
                    assignee: repository.users[n % 2],
                    title: String(count - n)
                }));
            });
            rootTasks[1].children = new Backbone.Collection([
                new TaskModel(chance.task({
                    title: '2'
                })),
                new TaskModel(chance.task({
                    title: '1'
                }))
            ]);
            createFixture(rootTasks, {
                grouping: [ assigneeGrouping ],
                comparator: function (model) {
                    return model.get('title');
                }
            });

            // Verify outcome: all levels of the tree should be sorted now.
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                originalCollection.at(2),
                originalCollection.at(0),
                virtualCollection.at(3),
                originalCollection.at(1),
                originalCollection.at(1).children.at(0),
                originalCollection.at(1).children.at(1)
            ]);
        });
    });

    describe('When no grouping is set', function ()
    {
        it('should pass through default collection', function ()
        {
            createFixture(_.times(50, function () {
                return chance.task();
            }));

            expectCollectionsToBeEqual(virtualCollection, originalCollection);
        });
    });

    describe('When grouping plain list', function ()
    {
        it('should group by iterator', function ()
        {
            createFixture(_.times(4, function (n) {
                return chance.task({ assignee: repository.users[n % 2] });
            }), {
                grouping: [ assigneeGrouping ]
            });

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                originalCollection.at(0),
                originalCollection.at(2),
                virtualCollection.at(3),
                originalCollection.at(1),
                originalCollection.at(3)
            ]);
        });

        it('should sort groups with comparator', function ()
        {
            var user1 = chance.user({ name: 'Ken' });
            var user2 = chance.user({ name: 'Ben' });
            createFixture(_.times(4, function (n) {
                return chance.task({ assignee: n % 2 ? user1 : user2 });
            }), {
                grouping: [
                    {
                        modelFactory: function (model) {
                            return model.get('assignee');
                        },
                        comparator: function (model)
                        {
                            return model.get('assignee').get('name');
                        },
                        iterator: function (model)
                        {
                            return model.get('assignee').get('id');
                        }
                    }
                ]
            });

            expect(virtualCollection.at(0).id).toEqual(user2.id, 'Ben goes first');
            expect(virtualCollection.at(3).id).toEqual(user1.id, 'Then goes Ken');
        });

        it('should sort items within a group with comparator function', function ()
        {
            var count = 4;
            createFixture(_.times(count, function (n) {
                return chance.task({
                    title: 'synthetic title ' + count--,
                    assignee: repository.users[n % 2]
                });
            }), {
                grouping: [ assigneeGrouping ],
                comparator: function (model) {
                    return model.get('title');
                }
            });

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                originalCollection.at(2),
                originalCollection.at(0),
                virtualCollection.at(3),
                originalCollection.at(3),
                originalCollection.at(1)
            ]);
        });

        it('should accept group iterator as a model attrubute name', function ()
        {
            var count = 2;
            var fixture = createFixture(_.times(count, function () {
                return chance.task({
                    title: 'synthetic title ' + count--
                });
            }), {
                grouping: [
                    {
                        modelFactory: function (model) {
                            return new Backbone.Model({ title: model.get('title') });
                        },
                        comparator: function (model) {
                            return model.get('title');
                        },
                        iterator: 'title'
                    }
                ]
            });

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(1),
                fixture.at(2),
                originalCollection.at(0)
            ]);
        });

        it('should accept group comparator as a model attrubute name', function ()
        {
            var count = 2;
            var fixture = createFixture(_.times(count, function () {
                return chance.task({
                    title: 'synthetic title ' + count--
                });
            }), {
                grouping: [
                    {
                        modelFactory: function (model) {
                            return new Backbone.Model({ title: model.get('title') });
                        },
                        comparator: 'title',
                        iterator: 'title'
                    }
                ]
            });

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(1),
                fixture.at(2),
                originalCollection.at(0)
            ]);
        });

        it('should accept group modelFactory as a model attrubute name', function ()
        {
            var count = 2;
            var fixture = createFixture(_.times(count, function () {
                return chance.task({
                    title: 'synthetic title ' + count--
                });
            }), {
                grouping: [
                    {
                        modelFactory: 'title',
                        comparator: 'title',
                        iterator: 'title'
                    }
                ]
            });

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(1),
                fixture.at(2),
                originalCollection.at(0)
            ]);
            expect(fixture.at(0).get('displayText')).toEqual(originalCollection.at(1).get('title'));
            expect(fixture.at(0).get('groupingModel')).toEqual(true);
        });

        it('should be able to omit modelFactory and comparator', function ()
        {
            var count = 2;
            var fixture = createFixture(_.times(count, function () {
                return chance.task({
                    title: 'synthetic title ' + count--
                });
            }), {
                grouping: [
                    {
                        iterator: 'title'
                    }
                ]
            });

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(1),
                fixture.at(2),
                originalCollection.at(0)
            ]);
            expect(fixture.at(0).get('displayText')).toEqual(originalCollection.at(1).get('title'));
            expect(fixture.at(0).get('groupingModel')).toEqual(true);
        });

        it('should compute affected attributes from field based options', function ()
        {
            var count = 2;
            var fixture = createFixture(_.times(count, function () {
                return chance.task({
                    title: 'synthetic title ' + count--
                });
            }), {
                grouping: [
                    {
                        iterator: 'title'
                    }
                ]
            });

            originalCollection.at(0).set('title', 'synthetic title 0');

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(0),
                fixture.at(2),
                originalCollection.at(1)
            ]);
        });
    });

    describe('When changing a model', function ()
    {
        it('should update grouping on affected attribute change', function ()
        {
            var count = 4;
            var fixture = createFixture(_.times(count, function (n) {
                return chance.task({
                    assignee: repository.users[n % 2]
                });
            }), {
                grouping: [ assigneeGrouping ]
            });
            var resetCallback = jasmine.createSpy('resetCallback');
            var addCallback = jasmine.createSpy('addCallback');
            var removeCallback = jasmine.createSpy('removeCallback');
            fixture.on('reset', resetCallback);
            fixture.on('add', addCallback);
            fixture.on('remove', removeCallback);

            originalCollection.at(0).set('assignee', repository.users[1]);

            expectCollectionsToBeEqual(fixture, [
                virtualCollection.at(0),
                originalCollection.at(2),
                virtualCollection.at(2),
                originalCollection.at(0),
                originalCollection.at(1),
                originalCollection.at(3)
            ]);
            expect(resetCallback).toHaveBeenCalledTimes(1);
            expect(addCallback).not.toHaveBeenCalled();
            expect(removeCallback).not.toHaveBeenCalled();
        });

        it('should update sorting on affected attribute change', function ()
        {
            var count = 4;
            var fixture = createFixture(_.times(count, function (n) {
                return chance.task({
                    title: 'synthetic title ' + count--,
                    assignee: repository.users[n % 2]
                });
            }), {
                grouping: [ assigneeGrouping ],
                comparator: function (model) {
                    return model.get('title');
                }
            });
            var resetCallback = jasmine.createSpy('resetCallback');
            var addCallback = jasmine.createSpy('addCallback');
            var removeCallback = jasmine.createSpy('removeCallback');
            fixture.on('reset', resetCallback);
            fixture.on('add', addCallback);
            fixture.on('remove', removeCallback);

            originalCollection.at(0).set('title', 'synthetic title 0');

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(0),
                originalCollection.at(2),
                fixture.at(3),
                originalCollection.at(3),
                originalCollection.at(1)
            ]);
            expect(resetCallback).toHaveBeenCalledTimes(1);
            expect(addCallback).not.toHaveBeenCalled();
            expect(removeCallback).not.toHaveBeenCalled();
        });
    });

    describe('When resetting parent collection', function ()
    {
        it('should reflect the changes', function ()
        {
            // Fixture setup
            createFixture(_.times(4, function (n) {
                return chance.task({
                    assignee: repository.users[n % 2]
                });
            }), {
                grouping: [ assigneeGrouping ]
            });
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                originalCollection.at(0),
                originalCollection.at(2),
                virtualCollection.at(3),
                originalCollection.at(1),
                originalCollection.at(3)
            ]);

            // Exercise system
            originalCollection.reset(_.times(4, function (n) {
                return chance.task({
                    assignee: repository.users[n % 2]
                });
            }));

            // Verify outcome
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                originalCollection.at(0),
                originalCollection.at(2),
                virtualCollection.at(3),
                originalCollection.at(1),
                originalCollection.at(3)
            ]);
        });
    });

    describe('When changing parent collection order', function ()
    {
        it('should reflect the changes on leaf level', function ()
        {
            // Fixture setup
            var count = 4;
            var i = count;
            createFixture(_.times(count, function (n) {
                return chance.task({
                    assignee: repository.users[n % 2],
                    title: 'some title ' + i--
                });
            }), {
                grouping: [ assigneeGrouping ]
            });
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                originalCollection.at(0),
                originalCollection.at(2),
                virtualCollection.at(3),
                originalCollection.at(1),
                originalCollection.at(3)
            ]);

            // Exercise system
            originalCollection.comparator = function (model) {
                return model.get('title');
            };
            originalCollection.sort();

            // Verify outcome
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                originalCollection.at(1),
                originalCollection.at(3),
                virtualCollection.at(3),
                originalCollection.at(0),
                originalCollection.at(2)
            ]);
        });
    });

    describe('When filtering collection', function ()
    {
        it('should filter grouped list', function ()
        {
            // Fixture setup and system exercise
            var count = 4;
            createFixture(_.times(count, function (n) {
                return chance.task({
                    assignee: repository.users[n % 2]
                });
            }), {
                grouping: [ assigneeGrouping ],
                filter: function (model) {
                    return model.get('assignee') === repository.users[1];
                }
            });

            // Verify outcome
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                originalCollection.at(1),
                originalCollection.at(3)
            ]);
        });
    });

    describe('When getting single value', function ()
    {
        it('should return it by id index', function ()
        {
            createFixture(_.times(10, function () {
                return chance.task();
            }), {
                grouping: [ assigneeGrouping ]
            });

            var expectedModel = originalCollection.at(0);
            var actualModel = virtualCollection.get(expectedModel.id);

            expect(expectedModel).toEqual(actualModel);
        });
    });

    describe('When removing item', function ()
    {
        it('should remove item with full reset', function ()
        {
            var fixture = createFixture(_.times(3, function () {
                return chance.task();
            }));
            var resetCallback = jasmine.createSpy('resetCallback');
            var addCallback = jasmine.createSpy('addCallback');
            var removeCallback = jasmine.createSpy('removeCallback');
            fixture.on('reset', resetCallback);
            fixture.on('add', addCallback);
            fixture.on('remove', removeCallback);

            originalCollection.remove(originalCollection.at(1));

            expectToHaveSameMembers(fixture.models, originalCollection.models);
            expect(resetCallback).toHaveBeenCalledTimes(1);
            expect(addCallback).not.toHaveBeenCalled();
            expect(removeCallback).not.toHaveBeenCalled();
        });

        it('should remove empty parent groups', function ()
        {
            var fixture = createFixture(_.times(3, function (n) {
                return chance.task({
                    assignee: repository.users[n]
                });
            }), {
                grouping: [ assigneeGrouping ]
            });

            originalCollection.remove(originalCollection.at(1));

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(0),
                fixture.at(2),
                originalCollection.at(1)
            ]);
        });

        it('should not remove parent groups if it is not empty', function ()
        {
            var fixture = createFixture(_.times(4, function (n) {
                return chance.task({
                    assignee: repository.users[n % 2]
                });
            }), {
                grouping: [ assigneeGrouping ]
            });

            originalCollection.remove(originalCollection.at(1));

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(0),
                originalCollection.at(1),
                fixture.at(3),
                originalCollection.at(2)
            ]);
        });
    });

    describe('When adding item', function ()
    {
        it('should add item with full reset', function ()
        {
            var fixture = createFixture(_.times(3, function () {
                return chance.task();
            }), { delayedAdd: false });
            var newTask = chance.task();
            var resetCallback = jasmine.createSpy('resetCallback');
            var addCallback = jasmine.createSpy('addCallback');
            var removeCallback = jasmine.createSpy('removeCallback');
            fixture.on('reset', resetCallback);
            fixture.on('add', addCallback);
            fixture.on('remove', removeCallback);

            originalCollection.add(newTask);

            expectToHaveSameMembers(fixture.models, originalCollection.models);
            expect(resetCallback).toHaveBeenCalledTimes(1);
            expect(addCallback).not.toHaveBeenCalled();
            expect(removeCallback).not.toHaveBeenCalled();
        });

        it('should add missing parent groups', function ()
        {
            var fixture = createFixture(_.times(2, function (n) {
                return chance.task({
                    assignee: repository.users[n]
                });
            }), {
                grouping: [ assigneeGrouping ],
                delayedAdd: false
            });
            var newTask = chance.task({ assignee: repository.users[2] });

            originalCollection.add(newTask);

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(0),
                fixture.at(2),
                originalCollection.at(1),
                fixture.at(4),
                originalCollection.at(2)
            ]);
        });

        it('should add item at exact position', function ()
        {
            var count = 4;
            var fixture = createFixture(_.times(count, function (n) {
                return chance.task({
                    title: 'synthetic title ' + count--,
                    assignee: repository.users[n % 2]
                });
            }), {
                grouping: [ assigneeGrouping ],
                comparator: function (model) {
                    return model.get('title');
                },
                delayedAdd: false
            });

            var newTask = new Backbone.Model(chance.task({ assignee: repository.users[0], title: "synthetic title 0" }));
            fixture.add(newTask, { at: 6 });

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(2),
                originalCollection.at(0),
                fixture.at(3),
                originalCollection.at(3),
                originalCollection.at(1),
                newTask
            ]);
        });

        it('should update internal index while adding item at exact position', function ()
        {
            var count = 4;
            var fixture = createFixture(_.times(count, function (n) {
                return chance.task({
                    title: 'synthetic title ' + count--,
                    assignee: repository.users[n % 2]
                });
            }), {
                grouping: [ assigneeGrouping ],
                comparator: function (model) {
                    return model.get('title');
                },
                delayedAdd: false
            });

            var newTask = new Backbone.Model(chance.task({ assignee: repository.users[0], title: "synthetic title 0" }));
            fixture.add(newTask, { at: 6 });
            fixture.__rebuildModels();

            expectCollectionsToBeEqual(fixture, [
                fixture.at(0),
                originalCollection.at(2),
                originalCollection.at(0),
                fixture.at(3),
                originalCollection.at(3),
                originalCollection.at(1),
                newTask
            ]);
        });
    });
});
