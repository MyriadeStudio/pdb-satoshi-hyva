define([
  "Satoshi_SatoshiUi/js/content-type/block-directive",
  "Magento_PageBuilder/js/utils/object",
], function (BlockDirectiveBase, _object) {
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
    return data.guarantees_columns && data.guarantees_columns.length > 0
      ? {
          guarantees: JSON.stringify(data.guarantees_columns),
        }
      : {};
  };

  /**
   * En plus du html_variable configure (block_directive, stocke en master-format
   * via tag-escaper), on duplique le directive construit dans `html` -> main.html.
   * Cela expose un observable LIVE que l'apercu du stage peut lire
   * (preview.js -> this.data.main.html()) pour rendre le vrai composant front,
   * icones comprises. Le master.html ne rend pas main.html : le format de
   * stockage reste inchange.
   */
  _proto.toDom = function toDom(data, config) {
    data = $super.toDom.call(this, data, config);

    var directive = config && config.html_variable
      ? data[config.html_variable]
      : "";

    if (directive) {
      (0, _object.set)(data, "html", directive);
    }

    return data;
  };

  return BlockDirective;
});
