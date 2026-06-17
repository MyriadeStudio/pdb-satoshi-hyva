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
     * Rendu de l'apercu BO via le directive {{block}} execute cote serveur
     * (meme mecanique que satoshi-collage / pdb-ui-usp). Permet d'afficher le
     * vrai rendu front du composant — notamment les icones (SVG) selectionnees
     * via le champ column_icon — au lieu d'une reconstruction Knockout.
     */
    function Preview(contentType, configData, observableUpdater) {
        PreviewBase.call(this, contentType, configData, observableUpdater);
        this.previewElement = $.Deferred();
        this.widgetUnsanitizedHtml = ko.observable($t("Configurez le composant Guarantees pour l'apercu."));
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

    Preview.prototype.afterObservablesUpdated = function () {
        var self = this;

        PreviewBase.prototype.afterObservablesUpdated.call(this);

        var data = this.contentType.dataStore.getState();

        if (!this.hasDataChanged(this.previousData, data)) {
            return;
        }

        this.previousData = JSON.parse(JSON.stringify(data));

        var directive = this.data.main && this.data.main.html
            ? this.data.main.html()
            : "";

        if (!directive) {
            return;
        }

        $.ajax(config.getConfig("preview_url"), {
            method: "POST",
            data: {
                role: this.config.name,
                directive: directive
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
