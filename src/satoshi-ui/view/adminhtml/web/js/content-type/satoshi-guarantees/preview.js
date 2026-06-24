define([
    "jquery",
    "knockout",
    "underscore",
    "mage/translate",
    "Magento_PageBuilder/js/config",
    "Magento_PageBuilder/js/content-type/preview"
], function ($, ko, _, $t, config, PreviewBase) {
    "use strict";

    /**
     * Apercu du stage BO via rendu serveur du directive {{block}}.
     *
     * On NE lit PAS this.data.main.html() (comme satoshi-collage/category) : le
     * master-format de guarantees imbrique des elements enfants (guarantees_columns
     * + block_directive) dans `main`, donc au chargement main.html contient ce blob
     * imbrique et non un directive propre -> rendu vide.
     *
     * On reconstruit donc le directive directement depuis les donnees live du
     * formulaire (guarantees_columns), avec l'encodage attendu par le block
     * (Helper\Decode : guillemets -> &amp;quote;). Le resultat est poste a
     * preview_url, rendu cote serveur par Renderer\WidgetDirective (mappe sur
     * satoshi_guarantees dans di.xml), qui resout {{block}} et renvoie le vrai
     * HTML front, icones SVG comprises.
     */
    var BLOCK_CLASS = "Satoshi\\SatoshiUi\\Block\\Guarantees";

    function Preview(contentType, configData, observableUpdater) {
        PreviewBase.call(this, contentType, configData, observableUpdater);
        this.previewElement = $.Deferred();
        this.widgetUnsanitizedHtml = ko.observable("");
        this.placeholderText = ko.observable($t("Ajoutez une colonne pour previsualiser le composant Guarantees."));
        this.ignoredKeysForBuild = [
            "margins_and_padding",
            "border",
            "border_color",
            "border_radius",
            "border_width",
            "css_classes",
            "text_align"
        ];
    }

    Preview.prototype = Object.create(PreviewBase.prototype);
    Preview.prototype.constructor = Preview;

    Preview.prototype.onAfterRender = function (element) {
        this.element = element;
        this.previewElement.resolve(element);
    };

    Preview.prototype.buildDirective = function (columns, data) {
        var attr = JSON.stringify(columns).replace(/"/g, "&amp;quote;");
        var directive = '{{block class="' + BLOCK_CLASS + '" guarantees="' + attr + '"';

        if (data.icon_style) {
            directive += ' icon_style="' + data.icon_style + '"';
        }
        if (data.icon_size) {
            directive += ' icon_size="' + data.icon_size + '"';
        }
        if (data.layout) {
            directive += ' item_layout="' + data.layout + '"';
        }
        if (data.icon_color) {
            directive += ' icon_color="' + data.icon_color + '"';
        }
        if (data.circle_color) {
            directive += ' circle_color="' + data.circle_color + '"';
        }
        if (data.text_color_scheme) {
            directive += ' text_color_scheme="' + data.text_color_scheme + '"';
        }

        return directive + "}}";
    };

    Preview.prototype.afterObservablesUpdated = function () {
        var self = this;

        PreviewBase.prototype.afterObservablesUpdated.call(this);

        var data = this.contentType.dataStore.getState();

        if (!this.hasDataChanged(this.previousData, data)) {
            return;
        }

        this.previousData = JSON.parse(JSON.stringify(data));

        var columns = data.guarantees_columns;

        if (!columns || !columns.length) {
            this.widgetUnsanitizedHtml("");
            return;
        }

        $.ajax(config.getConfig("preview_url"), {
            method: "POST",
            data: {
                role: this.config.name,
                directive: this.buildDirective(columns, data)
            }
        }).done(function (response) {
            if (!response || typeof response.data !== "object") {
                return;
            }

            self.widgetUnsanitizedHtml(response.data.error || response.data.content || "");

            self.previewElement.done(function () {
                $(self.element).trigger("contentUpdated");
            });
        });
    };

    Preview.prototype.hasDataChanged = function (previousData, newData) {
        previousData = _.omit(previousData, this.ignoredKeysForBuild);
        newData = _.omit(newData, this.ignoredKeysForBuild);

        return !_.isEqual(previousData, newData);
    };

    return Preview;
});
