/**
 * Developer: Stepan Burguchev
 * Date: 8/14/2015
 * Copyright: 2009-2015 Comindware®
 *       All Rights Reserved
 *
 * THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF Comindware
 *       The copyright notice above does not evidence any
 *       actual or intended publication of such source code.
 */

/* global define, require, Handlebars, Backbone, Marionette, $, _, Localizer */

define([
    'text!../templates/demoDropdownItem.html'
], function (template) {
    'use strict';

    return Marionette.ItemView.extend({
        template: Handlebars.compile(template),

        className: 'dropdown-list__i'
    });
});