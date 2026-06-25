import { Magics } from "alpinejs";
import { SELECTOR_LIST } from "@/plugins/Accessibility";

type SlidesAmountInViewType = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

type SliderConfig = {
  slidesAmountInView: SlidesAmountInViewType;
  gap: number;
  isAutoplay: boolean;
  autoplaySpeed?: number;
  // Opt-in (ex. Hero slider) — sans effet sur les autres sliders qui ne les passent pas.
  pauseOnHover?: boolean;
  enableDrag?: boolean;
};

export type SliderType = {
  [key: string | symbol]: any;

  isPrevBtnDisabled: boolean;
  isNextBtnDisabled: boolean;
  config: SliderConfig;
  currentSlideIndex: number;
  resizeObserver: ResizeObserver | null;
  slideWidth: number | null;
  autoplayInterval: number | null;

  configureAndStart(config: SliderConfig): void;
  play(): void;
  start(): void;
  debouncedHandleManualScroll: () => void;
  debounce: (func: Function, wait: number) => (...args: any[]) => void;
  init(): void;
  destroy(): void;
  updateCachedValues(): void;
  goToSlide(index: number, focus?: boolean): void;
  showNextSlide(): void;
  showPrevSlide(): void;
  touchStart(e: any): void;
  touchMove(e: any): void;
  handleManualScroll(): void;
  getSlidesAmountInView(): number;
  initHoverPause(): void;
  initDrag(): void;
} & Magics<{}>;

export const Slider = () =>
  <SliderType>{
    isPrevBtnDisabled: true,
    isNextBtnDisabled: false,
    currentSlideIndex: 1,
    resizeObserver: null,
    slideWidth: null,
    config: {},
    autoplayInterval: null,

    debouncedHandleManualScroll: () => {},

    configureAndStart(config) {
      this.config = config;
      this.start();
      this.play();
    },

    play() {
      const { isAutoplay, autoplaySpeed = 5000 } = this.config;
      if (!isAutoplay) {
        return;
      }

      if (this.autoplayInterval) {
        window.clearInterval(this.autoplayInterval);
      }

      this.autoplayInterval = window.setInterval(() => {
        if (this.currentSlideIndex < this.$refs.slider.childElementCount) {
          this.goToSlide(this.currentSlideIndex + 1);
        } else {
          this.goToSlide(1);
        }
      }, autoplaySpeed);
    },

    start() {
      const debouncedResizeHandler = Alpine.debounce(() => {
        this.updateCachedValues();
        this.handleManualScroll();
      }, 100);

      this.updateCachedValues();
      this.resizeObserver = new ResizeObserver(debouncedResizeHandler);
      this.resizeObserver.observe(this.$refs.slider);
      this.debouncedHandleManualScroll = Alpine.debounce(() => {
        this.handleManualScroll();
      }, 100);
      this.debouncedHandleManualScroll();

      const { gap } = this.config;
      const proxScrollTarget =
        (this.currentSlideIndex - 1) * ((this.slideWidth || 1) + gap);

      this.$refs.slider.scrollTo({
        left: proxScrollTarget,
        behavior: "smooth",
      });

      if (this.config.pauseOnHover) {
        this.initHoverPause();
      }
      if (this.config.enableDrag) {
        this.initDrag();
      }
    },

    // Met l'autoplay en pause au survol du composant (toute la zone via $root),
    // reprend à la sortie. Sans effet si l'autoplay est désactivé.
    initHoverPause() {
      const root = this.$root as HTMLElement;
      if (!root) {
        return;
      }
      root.addEventListener("mouseenter", () => {
        if (this.autoplayInterval) {
          window.clearInterval(this.autoplayInterval);
          this.autoplayInterval = null;
        }
      });
      root.addEventListener("mouseleave", () => {
        this.play();
      });
    },

    // Drag à la souris sur desktop (le tactile garde le scroll natif). Un seuil
    // de mouvement évite de déclencher les liens : au-delà du seuil, le clic de
    // fin de drag est annulé en phase de capture.
    initDrag() {
      const slider = this.$refs.slider as HTMLElement;
      if (!slider) {
        return;
      }
      let isDown = false;
      let startX = 0;
      let startScroll = 0;
      let moved = 0;
      const THRESHOLD = 6;

      slider.addEventListener("pointerdown", (e: PointerEvent) => {
        if (e.pointerType !== "mouse") {
          return;
        }
        isDown = true;
        moved = 0;
        startX = e.clientX;
        startScroll = slider.scrollLeft;
        slider.style.scrollBehavior = "auto";
      });

      window.addEventListener("pointermove", (e: PointerEvent) => {
        if (!isDown) {
          return;
        }
        const dx = e.clientX - startX;
        if (Math.abs(dx) > moved) {
          moved = Math.abs(dx);
        }
        slider.scrollLeft = startScroll - dx;
        if (Math.abs(dx) > THRESHOLD) {
          e.preventDefault();
          slider.classList.add("is-dragging");
        }
      });

      const endDrag = () => {
        if (!isDown) {
          return;
        }
        isDown = false;
        slider.style.scrollBehavior = "";
        slider.classList.remove("is-dragging");

        if (moved > THRESHOLD) {
          const cancelClick = (ev: Event) => {
            ev.preventDefault();
            ev.stopPropagation();
          };
          slider.addEventListener("click", cancelClick, {
            capture: true,
            once: true,
          });
          window.setTimeout(() => {
            slider.removeEventListener("click", cancelClick, {
              capture: true,
            } as EventListenerOptions);
          }, 60);
          this.play();
        }
      };

      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    },

    destroy() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
    },

    updateCachedValues() {
      if (!this.$refs.slider) {
        return;
      }

      if (this.$refs.slider.childElementCount) {
        this.slideWidth = (
          this.$refs.slider.children[0] as HTMLElement
        ).offsetWidth;
      }
    },

    goToSlide(index: number, focus: boolean = false) {
      const { gap } = this.config;
      const maxIndex = this.$refs.slider.childElementCount;
      const validIndex = Math.max(1, Math.min(index, maxIndex));
      const proxScrollTarget =
        (validIndex - 1) * ((this.slideWidth || 1) + gap);

      this.$refs.slider.scrollTo({
        left: proxScrollTarget,
        behavior: Alpine.store("main").isReducedMotion ? "instant" : "smooth",
      });

      if (focus) {
        setTimeout(
          () => {
            const slide = this.$refs.slider.children[index - 1].querySelector(
              SELECTOR_LIST,
            ) as HTMLElement;
            slide.focus();
          },
          Alpine.store("main").isReducedMotion ? 0 : 500,
        );
      }

      this.currentSlideIndex = validIndex;
    },

    showNextSlide() {
      const nextIndex =
        this.currentSlideIndex + Math.floor(this.getSlidesAmountInView()) <=
        this.$refs.slider.childElementCount
          ? this.currentSlideIndex + Math.floor(this.getSlidesAmountInView())
          : this.$refs.slider.childElementCount;

      this.goToSlide(nextIndex);
      this.play();
    },

    showPrevSlide() {
      const prevIndex =
        this.currentSlideIndex - Math.floor(this.getSlidesAmountInView()) >= 1
          ? this.currentSlideIndex - Math.floor(this.getSlidesAmountInView())
          : 1;

      this.goToSlide(prevIndex);
      this.play();
    },

    handleManualScroll() {
      if (!this.$refs.slider) {
        return;
      }

      const { gap } = this.config;
      const slider = this.$refs.slider;
      const containerScrollLeft = slider.scrollLeft;
      // vvv Amount of scrolled over + 1
      const currentSlideIndex =
        Math.ceil(containerScrollLeft / ((this.slideWidth || 1) + gap)) + 1;

      this.currentSlideIndex = currentSlideIndex;

      // Désactivation basée sur la géométrie réelle du scroll (et non sur un
      // calcul slide-count, faux en mode "boutons" à largeur auto) : si le
      // contenu ne déborde pas, les deux flèches sont désactivées → le wrapper
      // x-show les masque (rien à faire défiler). Tolérance 1px sous-pixel.
      const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
      this.isPrevBtnDisabled = containerScrollLeft <= 1;
      this.isNextBtnDisabled = containerScrollLeft >= maxScrollLeft - 1;
    },

    getSlidesAmountInView() {
      const {
        slidesAmountInView: { xs, sm, md, lg, xl, xxl },
      } = this.config;
      const viewWidth = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0,
      );
      const screenSm = 640;
      const screenMd = 768;
      const screenLg = 1024;
      const screenXl = 1280;
      const screen2xl = 1536;

      if (viewWidth >= screen2xl) {
        return xxl;
      }

      if (viewWidth >= screenXl) {
        return xl;
      }

      if (viewWidth >= screenLg) {
        return lg;
      }

      if (viewWidth >= screenMd) {
        return md;
      }

      if (viewWidth >= screenSm) {
        return sm;
      }

      return xs;
    },
  };
