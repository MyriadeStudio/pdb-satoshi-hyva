/**
 * Trap focus plugin
 *  Objective:
 *    - Trap focus inside a modal or a popup
 *    - Focus on first tabbable element once popup is active.
 * Usage:
 *  - Add x-a11y-trap="condition" to the wrapper of the popup or modal, where condition should be true when popup is active.
 *  - x-a11y-trap-target.start="condition" – first element to jump to when trapped (will loop upon reaching it tabbing forwards)
 *  - x-a11y-trap-target.end="condition" – last element to jump to when trapped (will loop upon reaching it tabbing backwards)
 *  - x-a11y-trap-target.initial="condition" – initial element to trap (does not loop to it)
 *  - x-a11y-trap-element="condition" if extra elements needs to be added to focus trap. i.e: product preview needs to allow tabbing into header elements
 */
import type { Alpine as AlpineType } from "alpinejs";
import { TAB_KEY } from "@/utils/keyboard-keys";
import { isMobile } from "@/utils/device";

export const SELECTOR_LIST =
  "a, button, textarea, input, select, [role=radio][aria-checked]";

let trapInitial: HTMLElement | null = null;
let trapStart: HTMLElement | null = null;
let trapEnd: HTMLElement | null = null;
let trapEls: Element[] = [];

const RESIZABLE_ANIMATION_DURATION = 300;

// `.heading` too: a structural title may be a div carrying the heading class rather than an h-tag.
const LABEL_SELECTOR = "h1, h2, h3, h4, h5, .heading, p";

/**
 * Tells whether an element is displayed: neither it nor any ancestor up to `root` is `display: none`.
 * Testing the element alone let hidden content through, and a popup may stay in the DOM while closed
 * (the mobile menu shares the popup container with the cart and the account): its links would join
 * the Tab loop and its title would name the open popup.
 */
const isDisplayedWithin = (root: Element) => {
  const cache = new Map<Element, boolean>();

  const isDisplayed = (element: Element): boolean => {
    if (element === root) {
      return true;
    }

    const cached = cache.get(element);

    if (cached !== undefined) {
      return cached;
    }

    const parent = element.parentElement;
    const displayed =
      window.getComputedStyle(element).display !== "none" &&
      (parent === null || isDisplayed(parent));

    cache.set(element, displayed);

    return displayed;
  };

  return isDisplayed;
};

export default function (Alpine: AlpineType) {
  Alpine.directive(
    "a11y-trap",
    (el, { expression, modifiers }, { evaluateLater, effect, cleanup }) => {
      const getIsTrapped = evaluateLater(expression);

      // The element naming the popup gets the id "popup-label" while trapped; its own id is put back
      // on release, so that a popup kept in the DOM does not leave a stale "popup-label" behind.
      let labelRef: Element | null = null;
      let labelOriginalId: string | null = null;

      const releaseLabel = () => {
        if (!labelRef) {
          return;
        }

        if (labelOriginalId) {
          labelRef.id = labelOriginalId;
        } else {
          labelRef.removeAttribute("id");
        }

        labelRef = null;
        labelOriginalId = null;
      };

      const onKeyDown = async (e: KeyboardEvent) => {
        const isDisplayed = isDisplayedWithin(el);
        const focusEls = Array.from(el.querySelectorAll(SELECTOR_LIST)).filter(
          // Skip hidden elements, including those inside a hidden container
          (element) => isDisplayed(element),
        );
        const allFocusEls = trapEls.concat(focusEls);
        const first = (trapStart || allFocusEls[0]) as HTMLElement;
        const last = (trapEnd ||
          allFocusEls[allFocusEls.length - 1]) as HTMLElement;

        if (e.key !== TAB_KEY) {
          return;
        }

        if (e.shiftKey) {
          if (e.target === first) {
            last?.focus();
            e.preventDefault();
          }
          return;
        }

        if (e.target === last) {
          first?.focus();
          e.preventDefault();
        }
      };

      const trapFocus = () => {
        // Add event listener for tabs to trap them inside
        document.addEventListener("keydown", onKeyDown);

        el.setAttribute("role", "dialog");
        el.setAttribute("aria-modal", "true");

        const isDisplayed = isDisplayedWithin(el);

        // The label may itself be visually hidden (it only names the popup), but not sit inside a hidden
        // container, which holds another popup's content.
        releaseLabel();
        labelRef =
          Array.from(el.querySelectorAll(LABEL_SELECTOR)).find(
            (element) =>
              element.parentElement === null ||
              isDisplayed(element.parentElement),
          ) ?? null;

        if (labelRef) {
          labelOriginalId = labelRef.getAttribute("id");
          labelRef.id = "popup-label";
          el.setAttribute("aria-labelledby", "popup-label");
        }

        const firstVisibleEl = Array.from(
          el.querySelectorAll(SELECTOR_LIST),
        ).find((element) => isDisplayed(element));

        if (isMobile()) {
          return;
        }

        // Focus on first element!
        const first = (trapStart ||
          trapInitial ||
          firstVisibleEl) as HTMLElement;

        first?.focus();
      };

      const removeTrapFocus = () => {
        document.removeEventListener("keydown", onKeyDown);
        el.removeAttribute("role");
        el.removeAttribute("aria-modal");
        el.removeAttribute("aria-labelledby");
        releaseLabel();
      };

      effect(() => {
        getIsTrapped((trapped) => {
          if (!trapped) {
            removeTrapFocus();
            return;
          }

          setTimeout(trapFocus, RESIZABLE_ANIMATION_DURATION);

          if (modifiers.includes('watch')) {
            // Observe and run when focusable elements are rendered. i.e: waiting for preview to request & render.
            const observer = new MutationObserver(() => {
              if (el.querySelectorAll(SELECTOR_LIST).length) {
                setTimeout(trapFocus, RESIZABLE_ANIMATION_DURATION);
                observer.disconnect();
              }
            });
            observer.observe(el, { subtree: true, childList: true });
          }
        });
      });

      cleanup(removeTrapFocus);
    },
  );

  Alpine.directive(
    "a11y-trap-target",
    (el, { modifiers, expression }, { evaluateLater, effect, cleanup }) => {
      const getIsTrapped = evaluateLater(expression);

      effect(() => {
        getIsTrapped((trapped) => {
          if (trapped) {
            if (modifiers.includes("start")) {
              trapStart = el;
            } else if (modifiers.includes("end")) {
              trapEnd = el;
            } else if (modifiers.includes("initial")) {
              trapInitial = el;
            }
          } else {
            if (modifiers.includes("start") && trapStart === el) {
              trapStart = null;
            } else if (modifiers.includes("end") && trapEnd === el) {
              trapEnd = null;
            } else if (modifiers.includes("initial") && trapInitial === el) {
              trapInitial = null;
            }
          }
        });
      });

      cleanup(() => {
        if (modifiers.includes("start")) {
          trapStart = null;
        } else if (modifiers.includes("end")) {
          trapEnd = null;
        } else if (modifiers.includes("initial")) {
          trapInitial = null;
        }
      });
    },
  );

  Alpine.directive(
    "a11y-trap-element",
    (el, { expression }, { evaluateLater, effect, cleanup }) => {
      const getIsActive = evaluateLater(expression);

      effect(() => {
        getIsActive((active) => {
          if (active) {
            if (!trapEls.includes(el)) {
              trapEls.push(el);
            }
          } else {
            if (trapEls.includes(el)) {
              trapEls.splice(trapEls.indexOf(el), 1);
            }
          }
        });
      });

      cleanup(() => {});
    },
  );

  Alpine.directive("a11y-radio", (el, _, { cleanup }) => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        !e.target ||
        !(e.target instanceof HTMLElement) ||
        e.target.role !== "radio"
      ) {
        throw "x-a11y-radio can only be used on elements of 'radio' role";
      }

      const isNext = e.key === "ArrowDown" || e.key === "ArrowRight";
      const isPrev = e.key === "ArrowUp" || e.key === "ArrowLeft";

      if (!isNext && !isPrev) return;

      e.preventDefault();

      const radioGroup = e.target.closest("[role=radiogroup]");

      if (!radioGroup) {
        throw "x-a11y-radio can only be used inside an element with 'radiogroup' role";
      }

      const radios = [...radioGroup.querySelectorAll("[role=radio]")];
      const currentRadio = e.target;
      const currentIndex = radios.indexOf(currentRadio);

      const nextIndex =
        currentIndex === radios.length - 1 ? 0 : currentIndex + 1;
      const prevIndex =
        currentIndex === 0 ? radios.length - 1 : currentIndex - 1;

      const newIndex = isNext ? nextIndex : prevIndex;
      const newRadio = radios[newIndex] as HTMLElement;

      newRadio.click();
      newRadio.focus();
    };

    el.addEventListener("keydown", onKeyDown);

    cleanup(() => {
      el.removeEventListener("keydown", onKeyDown);
    });
  });
}
