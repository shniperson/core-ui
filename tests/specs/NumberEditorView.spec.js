/**
 * Developer: Stepan Burguchev
 * Date: 6/14/2016
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

"use strict";

import core from 'coreApi';
import { initializeCore } from '../utils/helpers';
import 'jasmine-jquery';

describe('Editors', function () {
    beforeEach(function () {
        this.rootRegion = initializeCore();
    });

    describe('NumberEditorView', function () {
        let findInput = function (view) {
            return view.$('input');
        };

        it('should get focus when focus() is called', function () {
            // arrange
            let model = new Backbone.Model({
                data: 123
            });
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data'
            });
            this.rootRegion.show(view);

            // act
            view.focus();

            // assert
            expect(findInput(view)).toBeFocused();
            expect(view.hasFocus).toEqual(true, 'Must have focus.');
        });

        it('should lose focus when blur() is called', function () {
            // arrange
            let model = new Backbone.Model({
                data: 123
            });
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data'
            });
            this.rootRegion.show(view);
            view.focus();

            // act
            view.blur();

            // assert
            expect(findInput(view)).not.toBeFocused();
            expect(view.hasFocus).toEqual(false, 'Mustn\'t have focus.');
        });

        it('should have `value` matched with initial value', function () {
            // arrange
            let model = new Backbone.Model({
                data: 123
            });
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data'
            });
            this.rootRegion.show(view);

            // act
            let value = view.getValue();

            // assert
            let expected = model.get('data');
            expect(Number(findInput(view).val())).toEqual(expected);
            expect(value).toEqual(expected);
        });

        it('should have `value` matched with initial value (w/o data binding).', function () {
            // arrange
            let expected = 123;
            let view = new core.form.editors.NumberEditor({
                value: expected
            });
            this.rootRegion.show(view);

            // act
            let value = view.getValue();

            // assert
            expect(Number(findInput(view).val())).toEqual(expected);
            expect(value).toEqual(expected);
        });

        it('should update `value` and send `change` on user change.', function () {
            // arrange
            let expected = 321;
            let model = new Backbone.Model({
                data: 123
            });
            let onChangeCallback = jasmine.createSpy('onChangeCallback');
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data'
            });
            this.rootRegion.show(view);
            view.on('change', onChangeCallback);

            // act
            view.focus();
            let input = findInput(view);
            input.val(expected);
            input.change();

            // assert
            expect(view.getValue()).toEqual(expected);
            expect(onChangeCallback).toHaveBeenCalledTimes(1);
        });

        it('should update `value` and send `change` on user change (w/o data binding).', function () {
            // arrange
            let expected = 321;
            let onChangeCallback = jasmine.createSpy('onChangeCallback');
            let view = new core.form.editors.NumberEditor({
                value: 123
            });
            this.rootRegion.show(view);
            view.on('change', onChangeCallback);

            // act
            view.focus();
            let input = findInput(view);
            input.val(expected);
            input.change();

            // assert
            expect(view.getValue()).toEqual(expected);
            expect(onChangeCallback).toHaveBeenCalledTimes(1);
        });

        it('should update `value` on model change', function () {
            // arrange
            let onChangeCallback = jasmine.createSpy('onChangeCallback');
            let model = new Backbone.Model({
                data: 123
            });
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data'
            });
            this.rootRegion.show(view);
            view.on('change', onChangeCallback);

            // act
            model.set('data', 321);
            let value = view.getValue();

            // assert
            let expected = model.get('data');
            expect(Number(findInput(view).val())).toEqual(expected);
            expect(value).toEqual(expected);
            expect(onChangeCallback).not.toHaveBeenCalled();
        });

        it('should not commit if `autocommit: false`', function () {
            // arrange
            let expected = 123;
            let model = new Backbone.Model({
                data: expected
            });
            let onChangeCallback = jasmine.createSpy('onChangeCallback');
            let onCommitCallback = jasmine.createSpy('onCommitCallback');
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data'
            });
            this.rootRegion.show(view);
            view.on('change', onChangeCallback);
            view.on('value:committed', onCommitCallback);

            // act
            view.focus();
            let input = findInput(view);
            input.val(321);
            input.change();

            // assert
            expect(model.get('data')).toEqual(expected);
            expect(onChangeCallback).toHaveBeenCalledTimes(1);
            expect(onCommitCallback).not.toHaveBeenCalled();
        });

        it('should commit if `autocommit: true`', function () {
            // arrange
            let expected = 321;
            let model = new Backbone.Model({
                data: 123
            });
            let onChangeCallback = jasmine.createSpy('onChangeCallback');
            let onCommitCallback = jasmine.createSpy('onCommitCallback');
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data',
                autocommit: true
            });
            this.rootRegion.show(view);
            view.on('change', onChangeCallback);
            view.on('value:committed', onCommitCallback);

            // act
            view.focus();
            let input = findInput(view);
            input.val(expected);
            input.change();

            // assert
            expect(model.get('data')).toEqual(expected);
            expect(onChangeCallback).toHaveBeenCalledTimes(1);
            expect(onCommitCallback).toHaveBeenCalledTimes(1);
        });

        it('should have `isEmptyValue() === true` if null', function () {
            // arrange
            let model = new Backbone.Model({
                data: null
            });
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data'
            });
            this.rootRegion.show(view);

            // act
            let isEmpty = view.isEmptyValue();

            // assert
            expect(isEmpty).toEqual(true);
        });

        it('should have `isEmptyValue() === false` if has value including 0', function () {
            // arrange
            let model = new Backbone.Model({
                data: 123
            });
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data'
            });
            this.rootRegion.show(view);

            // act
            let isEmpty = view.isEmptyValue();
            view.setValue(0);
            let isEmptyIfZero = view.isEmptyValue();

            // assert
            expect(isEmpty).toEqual(false);
            expect(isEmptyIfZero).toEqual(false);
        });

        it('should update `value` when typing if `changemode: \'keydown\'`', function () {
            // arrange
            let onChangeCallback = jasmine.createSpy('onChangeCallback');
            let model = new Backbone.Model({
                data: 123
            });
            let view = new core.form.editors.NumberEditor({
                model: model,
                key: 'data',
                changeMode: 'keydown'
            });
            this.rootRegion.show(view);
            view.on('change', onChangeCallback);

            // act
            view.focus();
            let input = findInput(view);
            input.val(312);
            input.trigger('keyup');

            // assert
            expect(onChangeCallback).toHaveBeenCalledTimes(1);
        });
    });
});
