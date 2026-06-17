/**
 * Satoshi_SatoshiUi
 *
 * Règle de validation "validate-video-source-relative" pour les composants
 * vidéo Satoshi (video / video-hero).
 *
 * La règle core Magento "validate-video-source"
 * (Magento_PageBuilder/js/form/element/validator-rules-mixin) impose une URL
 * ABSOLUE via validateIsUrl(), ce qui interdit de saisir un chemin relatif
 * (ex: /media/wysiwyg/.../video.webm) sans le nom de domaine.
 *
 * Cette règle accepte EN PLUS les chemins relatifs pointant vers un fichier
 * vidéo (.mp4 / .webm / .ogv), tout en continuant d'accepter les URLs
 * absolues YouTube / Vimeo / fichiers vidéo.
 */
define([
    'Magento_Ui/js/lib/validation/utils'
], function (utils) {
    'use strict';

    var videoFileExtension = /\.(mp4|ogv|webm)(?!\w)/,
        videoServices = /youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com/,
        absoluteUrl = /^(https?:)?\/\//i;

    return function (validator) {
        validator.addRule(
            'validate-video-source-relative',
            function (href) {
                if (utils.isEmptyNoTrim(href)) {
                    return true;
                }

                href = (href || '').replace(/^\s+/, '').replace(/\s+$/, '');

                // URL absolue : YouTube / Vimeo / fichier vidéo distant.
                if (absoluteUrl.test(href)) {
                    return videoServices.test(href) || videoFileExtension.test(href);
                }

                // Chemin relatif (ou absolu sans domaine) : doit pointer vers
                // un fichier vidéo supporté.
                return videoFileExtension.test(href);
            },
            'Veuillez saisir une URL ou un chemin vidéo valide. Les valeurs acceptées :'
                + ' un fichier vidéo (.mp4, .webm, .ogv), un chemin relatif vers un tel fichier,'
                + ' ou un lien YouTube / Vimeo.'
        );

        return validator;
    };
});
