define([
  "Satoshi_SatoshiUi/js/content-type/block-directive",
], function (BlockDirectiveBase) {
  "use strict";
  const $super = BlockDirectiveBase.prototype;

  function BlockDirective(parent, config, stageId) {
    BlockDirectiveBase.call(this, parent, config, stageId);
  }

  BlockDirective.prototype = Object.create($super);

  var _proto = BlockDirective.prototype;

  /**
   * Filtre les paramètres GET d'une URL YouTube et applique autoplay/mute/loop.
   * (Repris de satoshi-video-hero/block-directive.js.)
   */
  _proto.parseYoutubeGetParams = function parseYoutubeGetParams(url, data, id) {
    var acceptableYouTubeParams = [
      "rel", "controls", "autoplay", "mute", "loop", "playlist",
      "cc_lang_pref", "cc_load_policy", "color", "disablekb", "end", "fs",
      "hl", "iv_load_policy", "modestbranding", "start",
    ];
    var a = document.createElement("a");
    a.href = url;
    var urlGetParams = {};
    a.search
      .slice(a.search.indexOf("?") + 1)
      .split("&")
      .map(function (hash) {
        var _hash$split = hash.split("="),
          key = _hash$split[0],
          val = _hash$split[1];
        urlGetParams[key] = decodeURIComponent(val);
      });
    var filteredGetParams = {};

    for (var _i = 0; _i < acceptableYouTubeParams.length; _i++) {
      var param = acceptableYouTubeParams[_i];
      if (urlGetParams.hasOwnProperty(param)) {
        filteredGetParams[param] = urlGetParams[param];
      }
    }
    if (data.muted === "true") {
      filteredGetParams.mute = "1";
    } else {
      delete filteredGetParams.mute;
    }
    if (data.loop === "true") {
      filteredGetParams.loop = "1";
      filteredGetParams.playlist = id;
    } else {
      delete filteredGetParams.loop;
    }
    if (data.autoplay === "true") {
      filteredGetParams.autoplay = "1";
    } else {
      delete filteredGetParams.autoplay;
    }

    var processedGetParams = [];
    for (var _param in filteredGetParams) {
      if (filteredGetParams.hasOwnProperty(_param)) {
        processedGetParams.push(encodeURI(_param + "=" + filteredGetParams[_param]));
      }
    }
    processedGetParams.push("controls=0");

    return processedGetParams.length > 0 ? "?" + processedGetParams.join("&") : "";
  };

  /**
   * Normalise la source vidéo d'une slide en src exploitable (embed YouTube/Vimeo
   * ou lien direct mp4/webm).
   */
  _proto.parseVideoSource = function parseVideoSource(slide) {
    let src = slide.video_source;
    if (!src) {
      return "";
    }

    const youtubeRegExp = new RegExp(
      "^(?:https?://|//)?(?:www\\.|m\\.)?" +
        "(?:youtu\\.be/|youtube\\.com/(?:embed/|v/|watch\\?v=|watch\\?.+&v=))([\\w-]{11})(?![\\w-])"
    );
    const vimeoRegExp = new RegExp(
      "https?://(?:www\\.|player\\.)?vimeo.com/(?:channels/" +
        "(?:\\w+/)?|groups/([^/]*)/videos/|album/(\\d+)/video/|video/|)(\\d+)(?:$|/|\\?)"
    );

    if (youtubeRegExp.test(src)) {
      src =
        "https://www.youtube.com/embed/" +
        youtubeRegExp.exec(src)[1] +
        this.parseYoutubeGetParams(src, slide, youtubeRegExp.exec(src)[1]);
    } else if (vimeoRegExp.test(src)) {
      src =
        "https://player.vimeo.com/video/" +
        vimeoRegExp.exec(src)[3] +
        "?title=0&byline=0&portrait=0" +
        (slide.autoplay === "true" ? "&autoplay=1&autopause=0" : "") +
        (slide.muted === "true" ? "&muted=1" : "") +
        (slide.loop === "true" ? "&loop=1" : "");
    }

    return src;
  };

  /**
   * Convertit une slide du dynamicRows en objet propre, prêt à être consommé par
   * le template frontend.
   */
  _proto.mapSlide = function mapSlide(slide) {
    const mapped = {
      slide_type: slide.slide_type === "video" ? "video" : "image",
      heading: slide.heading || "",
      description: slide.description || "",
      button_label: slide.button_label || "",
      button_link: slide.button_link || "",
      button_target: slide.button_target,
      button_style: slide.button_style === "outlined" ? "outlined" : "filled",
      text_color_scheme: slide.text_color_scheme || "default",
      desktop_content_position: slide.desktop_content_position || "middle-center",
      mobile_content_position: slide.mobile_content_position || "middle-center",
      overlay_opacity: +slide.overlay_opacity / 100 || 0,
    };

    if (mapped.slide_type === "video") {
      mapped.video_source = this.parseVideoSource(slide);
      mapped.autoplay = slide.autoplay;
      mapped.loop = slide.loop;
      mapped.muted = slide.muted;
      if (slide.video_image && slide.video_image[0]) {
        mapped.image = slide.video_image[0].url;
      }
      if (slide.video_mobile_image && slide.video_mobile_image[0]) {
        mapped.mobile_image = slide.video_mobile_image[0].url;
      }
    } else {
      if (slide.image && slide.image[0]) {
        mapped.image = slide.image[0].url;
      }
      if (slide.mobile_image && slide.mobile_image[0]) {
        mapped.mobile_image = slide.mobile_image[0].url;
      }
    }

    return mapped;
  };

  _proto.getAdditionalBlockAttributes = function getAdditionalBlockAttributes(data) {
    const self = this;
    const slides = (data.slides || []).map(function (slide) {
      return self.mapSlide(slide);
    });

    return {
      slider_height: data.slider_height,
      autoplay_speed: parseInt(data.autoplay_speed, 10) || 0,
      show_arrows: data.show_arrows,
      show_dots: data.show_dots,
      slides: JSON.stringify(slides),
    };
  };

  return BlockDirective;
});
