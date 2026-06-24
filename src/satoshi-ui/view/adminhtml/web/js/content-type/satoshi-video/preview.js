define([
  "knockout",
  "Magento_PageBuilder/js/content-type/preview",
], function (ko, PreviewBase) {
  "use strict";
  var $super;

  function Preview(parent, config, stageId) {
    PreviewBase.call(this, parent, config, stageId);
    // Tant que l'admin n'a pas cliqué sur "play", l'iframe vidéo (YouTube/Vimeo)
    // n'est PAS montée dans le DOM. Une iframe cachée (display:none) charge quand
    // même son src et l'embed joue le son à l'ouverture de la page en BO.
    this.isVideoPlaying = ko.observable(false);
  }

  Preview.prototype = Object.create(PreviewBase.prototype);
  $super = PreviewBase.prototype;

  Preview.prototype.handleClick = function handleClick(preview, event) {
    this.isVideoPlaying(true);
  };

  return Preview;
});
