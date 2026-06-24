define([
  "Satoshi_SatoshiUi/js/content-type/block-directive",
  "Satoshi_SatoshiUi/js/helper/link",
], function (BlockDirectiveBase, linkHelper) {
  "use strict";
  const $super = BlockDirectiveBase.prototype;

  function BlockDirective(parent, config, stageId) {
    BlockDirectiveBase.call(this, parent, config, stageId);
  }

  BlockDirective.prototype = Object.create($super);

  var _proto = BlockDirective.prototype;

  _proto.getAdditionalBlockAttributes = function getAdditionalBlockAttributes(
    data
  ) {
    const tidyLink = linkHelper.prototype.tidyLink;

    return {
      appearance: data.appearance,
      heading: data.heading,
      content: data.content,
      button_label: data.button_label,
      button_link: JSON.stringify(tidyLink(data.button_link)),
      ...(data.text_color_scheme
        ? { text_color_scheme: data.text_color_scheme }
        : {}),
      ...(data.button_style ? { button_style: data.button_style } : {}),
      ...(data.image[0] ? { image: data.image[0].url } : {}),
      ...(data.mobile_image[0] ? { mobile_image: data.mobile_image[0].url } : {}),
    };
  };

  return BlockDirective;
});
