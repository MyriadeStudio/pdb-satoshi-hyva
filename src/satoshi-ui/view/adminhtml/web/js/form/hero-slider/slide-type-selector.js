define([
  "uiRegistry",
  "Magento_Ui/js/form/element/select",
], function (uiRegistry, select) {
  "use strict";

  // Champs média propres à chaque type de slide. Le sélecteur affiche/masque
  // l'un ou l'autre groupe (cf. Satoshi_SatoshiUi/js/form/collage/type-selector,
  // étendu ici pour basculer des GROUPES de champs plutôt qu'un champ unique).
  var IMAGE_FIELDS = ["image", "mobile_image"];
  var VIDEO_FIELDS = [
    "video_source",
    "video_image",
    "video_mobile_image",
    "autoplay",
    "loop",
    "muted",
  ];

  return select.extend({
    /**
     * Affiche les champs du type sélectionné, masque ceux de l'autre type.
     * uiRegistry.get(name, cb) défère l'appel jusqu'à l'enregistrement du champ
     * frère → fonctionne aussi à l'ouverture d'une slide déjà enregistrée.
     *
     * @param {String} value
     */
    toggleFields: function (value) {
      var parent = this.parentName;
      var isVideo = value === "video";

      IMAGE_FIELDS.forEach(function (name) {
        uiRegistry.get(parent + "." + name, function (field) {
          if (field) {
            isVideo ? field.hide() : field.show();
          }
        });
      });

      VIDEO_FIELDS.forEach(function (name) {
        uiRegistry.get(parent + "." + name, function (field) {
          if (field) {
            isVideo ? field.show() : field.hide();
          }
        });
      });
    },

    /**
     * @param {String} value
     */
    onUpdate: function (value) {
      this.toggleFields(value);

      return this._super();
    },

    /**
     * Applique l'état initial une fois le composant prêt.
     */
    initialize: function () {
      this._super();
      this.toggleFields(this.value());

      return this;
    },
  });
});
