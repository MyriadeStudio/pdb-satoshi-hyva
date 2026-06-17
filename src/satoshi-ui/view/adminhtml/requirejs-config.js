/**
 * Satoshi_SatoshiUi - PageBuilder admin validation rules.
 *
 * Ajoute une règle "validate-video-source-relative" tolérant les chemins
 * relatifs (en plus des URLs absolues YouTube / Vimeo / fichiers vidéo).
 */
var config = {
    config: {
        mixins: {
            'Magento_Ui/js/lib/validation/validator': {
                'Satoshi_SatoshiUi/js/form/element/validator-rules-relative-video-mixin': true
            }
        }
    }
};
