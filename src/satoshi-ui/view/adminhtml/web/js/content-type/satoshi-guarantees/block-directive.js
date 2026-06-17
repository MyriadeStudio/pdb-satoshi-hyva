define(["Satoshi_SatoshiUi/js/content-type/block-directive"], function (
  BlockDirectiveBase,
) {
  "use strict";
  const $super = BlockDirectiveBase.prototype;

  function BlockDirective(parent, config, stageId) {
    BlockDirectiveBase.call(this, parent, config, stageId);
  }

  BlockDirective.prototype = Object.create($super);

  var _proto = BlockDirective.prototype;

  _proto.getAdditionalBlockAttributes = function getAdditionalBlockAttributes(
    data,
  ) {
    if (!data.guarantees_columns || data.guarantees_columns.length === 0) {
      return {};
    }

    var attributes = {
      guarantees: JSON.stringify(data.guarantees_columns),
    };

    if (data.icon_style) {
      attributes.icon_style = data.icon_style;
    }
    if (data.icon_size) {
      attributes.icon_size = data.icon_size;
    }
    if (data.layout) {
      // "layout" est un setter reserve d'AbstractBlock (setLayout) : on transmet
      // sous un nom neutre pour eviter la collision setDataUsingMethod.
      attributes.item_layout = data.layout;
    }
    if (data.icon_color) {
      attributes.icon_color = data.icon_color;
    }
    if (data.circle_color) {
      attributes.circle_color = data.circle_color;
    }

    return attributes;
  };

  return BlockDirective;
});
