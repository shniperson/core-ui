/**
 * Developer: Grigory Kuznetsov
 * Date: 10.09.2015
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

import { Handlebars, moment } from 'lib';
import { helpers, dateHelpers } from 'utils';
import LocalizationService from '../../../../../services/LocalizationService';
import template from '../templates/dateInput.hbs';

export default Marionette.ItemView.extend({
    initialize: function (options) {
        helpers.ensureOption(options, 'timezoneOffset');
        helpers.ensureOption(options, 'allowEmptyValue');
        this.editDateFormat = dateHelpers.getDateEditFormat();
    },

    template: Handlebars.compile(template),

    className: 'date-view',

    ui: {
        dateInput: '.js-date-input'
    },

    modelEvents: {
        'change:value': 'updateDisplayValue',
        'change:readonly': '__onEnabledChange',
        'change:enabled': '__onEnabledChange'
    },

    events: {
        'click': '__onClick',
        'focus @ui.dateInput': '__onFocus'
    },

    startEditing: function () {
        let value = this.model.get('value');
        let editableText = value ? moment.utc(value).utcOffset(this.getOption('timezoneOffset')).format(this.editDateFormat) : '';
        this.ui.dateInput.val(editableText);
    },

    endEditing: function () {
        let parsedInputValue = this.__getParsedInputValue();
        let inputIsEmpty = parsedInputValue === null;
        if (inputIsEmpty && this.options.allowEmptyValue) {
            this.__setModelValue(null);
        } else if (parsedInputValue.isValid()) {
            this.__setModelValue(parsedInputValue.toDate());
        }
        this.updateDisplayValue();
    },

    __getParsedInputValue: function () {
        let value = this.ui.dateInput.val();
        if (value === '') {
            return null;
        }
        return moment.utc(value, this.editDateFormat, true);
    },

    onRender: function () {
        this.setPlaceholder();
        this.setInputPermissions();
        this.updateDisplayValue();
    },

    __onEnabledChange: function () {
        this.setPlaceholder();
        this.setInputPermissions();
    },

    __onClick: function () {
        if (this.model.get('enabled') && !this.model.get('readonly')) {
            this.trigger('calendar:open');
        }
    },

    setPlaceholder: function () {
        if (!this.model.get('enabled') || this.model.get('readonly')) {
            this.placeholder = '';
        } else {
            this.placeholder = LocalizationService.get('CORE.FORM.EDITORS.DATE.EMPTYPLACEHOLDER');
        }

        this.ui.dateInput.prop('placeholder', this.placeholder);
    },

    setInputPermissions: function () {
        let enabled = this.model.get('enabled');
        let readonly = this.model.get('readonly');

        if (!enabled) {
            this.ui.dateInput.prop('disabled', true);
        } else {
            this.ui.dateInput.prop('disabled', false);
        }

        if (readonly) {
            this.ui.dateInput.prop('readonly', true);
        } else {
            this.ui.dateInput.prop('readonly', false);
        }
    },

    updateDisplayValue: function () {
        if (this.isDestroyed) {
            return;
        }
        let value = this.model.get('value');
        let formattedDisplayValue;
        if (value === null) {
            formattedDisplayValue = '';
        } else if (this.options.dateDisplayFormat) {
            formattedDisplayValue = moment(this.model.get('value')).locale(LocalizationService.langCode).format(this.options.dateDisplayFormat);
        } else {
            formattedDisplayValue = dateHelpers.getDisplayDate(moment.utc(this.model.get('value')).utcOffset(this.getOption('timezoneOffset')));
        }
        this.ui.dateInput.val(formattedDisplayValue);
    },

    __setModelValue: function (date) {
        let oldVal = this.model.get('value');
        let newVal = null;

        if (date === null || date === '') {
            newVal = null;
        } else if (oldVal && this.getOption('preserveTime')) {
            let momentOldVal = moment.utc(oldVal);
            let momentOldDisplayedDate = moment.utc(oldVal).utcOffset(this.getOption('timezoneOffset'));
            momentOldDisplayedDate = moment.utc({
                year: momentOldDisplayedDate.year(),
                month: momentOldDisplayedDate.month(),
                date: momentOldDisplayedDate.date()
            });
            // Figure out number of days between displayed old date and entered new date
            // and apply it to stored old date to prevent transition-through-the-day bugs
            let diff = moment.utc(date).diff(momentOldDisplayedDate, 'days');
            newVal = momentOldVal.date(momentOldVal.date() + (diff || 0)).toISOString();
        } else {
            newVal = moment.utc({
                year: date.getUTCFullYear(),
                month: date.getUTCMonth(),
                date: date.getUTCDate()
            }).minute(-this.getOption('timezoneOffset')).toISOString();
        }

        this.model.set({value: newVal});
    },

    __onFocus: function () {
        this.trigger('focus');
    },

    focus: function () {
        this.ui.dateInput.focus();
        this.trigger('focus');
        if (this.model.get('enabled') && !this.model.get('readonly')) {
            this.trigger('calendar:open');
        }
    }
});
