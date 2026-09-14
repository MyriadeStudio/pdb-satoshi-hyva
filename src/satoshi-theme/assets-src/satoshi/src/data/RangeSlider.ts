import type { Magics } from "alpinejs";
import { FILTER_PRICE_PARAM_NAME } from "@/data/Filters";

export type RangeSliderType = {
  isRightThumbActive: boolean;
  isLeftThumbActive: boolean;
  minRange: number;
  maxRange: number;
  currentMinValue: number;
  currentMaxValue: number;
  rangeMinSpace: number;
  isDragging: boolean;
  priceFilterTimeout: ReturnType<typeof setTimeout> | null;

  init(): void;
  valueToRatio(value: number): number;
  ratioToValue(ratio: number): number;
  minRatio(): number;
  maxRatio(): number;
  updateThumbPositions(): void;
  applyPriceFilter(): void;
  onThumbDrag(side: 'left' | 'right'): void;
  setActiveRangeValuesFromURL(): void;
} & Magics<{}>;

export const ANIMATION_DURATION = 350;
export const RANGE_MIN_SPACE = 5;
export const RANGE_SLIDER_CONTAINER_CLASS = "range-slider-container";

export const RangeSlider = (
  minRange: number | unknown,
  maxRange: number | unknown
) =>
  <RangeSliderType>{
    isRightThumbActive: false,
    isLeftThumbActive: false,
    minRange: Number(minRange) || 0,
    maxRange: Number(maxRange),
    currentMinValue: Number(minRange) || 0,
    currentMaxValue: Number(maxRange),
    rangeMinSpace: RANGE_MIN_SPACE,
    isDragging: false,
    priceFilterTimeout: null,

    init() {
      this.setActiveRangeValuesFromURL();
    },

    /*
     * Échelle logarithmique. Sur un catalogue où un article isolé à 24 469 €
     * côtoie un gros du fond sous 1 000 €, une échelle linéaire tasse presque
     * tout le catalogue dans les premiers pixels du rail. Le décalage de 1
     * évite log(0) et permet une borne basse à 0 : minRange donne 0, maxRange
     * donne 1, et la fonction reste strictement croissante entre les deux.
     */
    valueToRatio(value) {
      const span = this.maxRange - this.minRange;

      if (span <= 0) {
        return 0;
      }

      const offset = Math.max(value - this.minRange, 0);

      return Math.min(Math.log(offset + 1) / Math.log(span + 1), 1);
    },

    ratioToValue(ratio) {
      const span = this.maxRange - this.minRange;

      if (span <= 0) {
        return this.minRange;
      }

      const clamped = Math.min(Math.max(ratio, 0), 1);

      return this.minRange + Math.exp(clamped * Math.log(span + 1)) - 1;
    },

    minRatio() {
      return this.valueToRatio(this.currentMinValue);
    },

    maxRatio() {
      return this.valueToRatio(this.currentMaxValue);
    },

    updateThumbPositions() {
      if (this.currentMinValue < this.minRange) {
        this.currentMinValue = this.minRange;
      } else if (this.currentMinValue > this.currentMaxValue - this.rangeMinSpace) {
        this.currentMinValue = this.currentMaxValue - this.rangeMinSpace;
      }

      if (this.currentMaxValue > this.maxRange) {
        this.currentMaxValue = this.maxRange;
      } else if (this.currentMaxValue < this.currentMinValue + this.rangeMinSpace) {
        this.currentMaxValue = this.currentMinValue + this.rangeMinSpace;
      }

      // Applying mid-drag would navigate and re-render the filter block under the cursor,
      // snapping the thumb back. While dragging, only the clamping above runs; the filter is
      // applied once on release. The debounce still covers the Min/Max number inputs.
      if (this.isDragging) return;

      if (this.priceFilterTimeout) {
        clearTimeout(this.priceFilterTimeout);
      }

      this.priceFilterTimeout = setTimeout(() => {
        this.applyPriceFilter();
      }, ANIMATION_DURATION);
    },

    applyPriceFilter() {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set(FILTER_PRICE_PARAM_NAME, `${this.currentMinValue}-${this.currentMaxValue}`);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

      // @ts-ignore
      this.selectFilter(FILTER_PRICE_PARAM_NAME, `${this.currentMinValue}-${this.currentMaxValue}`, newUrl, true);
    },

    onThumbDrag(side: 'left' | 'right') {
      const isLeft = side === 'left';
      const isRight = side === 'right';

      // Alpine binds $el to the element the expression was evaluated on — here the thumb
      // itself, not the component root. Scoping the lookup to this instance (rather than a
      // document-wide one) matters because the filter set is rendered twice: desktop and
      // mobile portal. closest() covers the thumb; querySelector() the root, if ever called
      // from JS rather than from the @mousedown expression.
      const container =
        this.$el.closest(`.${RANGE_SLIDER_CONTAINER_CLASS}`) ??
        this.$el.querySelector(`.${RANGE_SLIDER_CONTAINER_CLASS}`);

      if (!container) return;

      this.isDragging = true;

      const onMouseOrTouchMove = (evt: MouseEvent | TouchEvent) => {
        const sliderRect = container.getBoundingClientRect();
        // `instanceof TouchEvent` throws on desktop Firefox, where TouchEvent is undefined.
        const x = "touches" in evt ? evt.touches[0].clientX : evt.clientX;
        const pos = (x - sliderRect.left) / sliderRect.width;
        const newValue = Math.round(this.ratioToValue(pos));

        if (isLeft) {
          this.isLeftThumbActive = true;
          this.currentMinValue = Math.min(Math.max(newValue, this.minRange), this.currentMaxValue - this.rangeMinSpace);
        } else if (isRight) {
          this.isRightThumbActive = true;
          this.currentMaxValue = Math.max(Math.min(newValue, this.maxRange), this.currentMinValue + this.rangeMinSpace);
        }

        this.updateThumbPositions();
      };

      const onMouseOrTouchUp = () => {
        if (isLeft) {
          this.isLeftThumbActive = false;
        } else if (isRight) {
          this.isRightThumbActive = false;
        }
        this.isDragging = false;
        this.applyPriceFilter();
        document.removeEventListener('mousemove', onMouseOrTouchMove);
        document.removeEventListener('mouseup', onMouseOrTouchUp);
        document.removeEventListener('touchmove', onMouseOrTouchMove);
        document.removeEventListener('touchend', onMouseOrTouchUp);
      };

      document.addEventListener('mousemove', onMouseOrTouchMove);
      document.addEventListener('mouseup', onMouseOrTouchUp);
      document.addEventListener('touchmove', onMouseOrTouchMove);
      document.addEventListener('touchend', onMouseOrTouchUp);
    },

    setActiveRangeValuesFromURL() {
      const urlPriceRange = new URLSearchParams(window.location.search).get(FILTER_PRICE_PARAM_NAME);
      if (urlPriceRange) {
        const [urlMin, urlMax] = urlPriceRange.split("-").map(Number);

        if (!isNaN(urlMin)) this.currentMinValue = urlMin;
        if (!isNaN(urlMax)) this.currentMaxValue = urlMax;
      }
    },
  };
