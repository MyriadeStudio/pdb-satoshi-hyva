import type { Alpine as AlpineType } from "alpinejs";
import { cachePage, enableFadeInImages, fetchPage } from "@/plugins/Transition";

const SKELETON_TEMPLATE_ID = "pagination-skeleton";
const SKELETON_HOST_ATTRIBUTE = "data-pagination-skeleton";

const appendPaginationContent = (rawContent: string) => {
  const regex =
    /<!-- pagination-content -->([\s\S]*?)<!-- end-pagination-content -->/g;
  const content = rawContent.match(regex);
  const newContent = content ? content[0] : "";
  const el = document.querySelector("[data-content-wrapper]");

  const newElements = document.createElement("div");
  newElements.style.display = "contents";
  newElements.innerHTML = newContent;

  if (el) {
    el.appendChild(newElements);
  }
};

/**
 * Ajoute à la grille autant de cartes fantômes que de produits attendus, le
 * temps que la page suivante arrive. Le gabarit est rendu côté PHP dans
 * `Magento_Theme::html/pager.phtml` pour ne pas dupliquer le markup ici.
 */
const showPaginationSkeleton = (): HTMLElement | null => {
  const template = document.getElementById(
    SKELETON_TEMPLATE_ID,
  ) as HTMLTemplateElement | null;
  const wrapper = document.querySelector("[data-content-wrapper]");

  if (!template || !wrapper) {
    return null;
  }

  const host = document.createElement("div");
  host.style.display = "contents";
  host.setAttribute(SKELETON_HOST_ATTRIBUTE, "");
  host.appendChild(template.content.cloneNode(true));
  wrapper.appendChild(host);

  return host;
};

const removePaginationSkeleton = (host: HTMLElement | null) => {
  if (host) {
    host.remove();
    return;
  }

  document
    .querySelectorAll(`[${SKELETON_HOST_ATTRIBUTE}]`)
    .forEach((element) => element.remove());
};

export default function (Alpine: AlpineType) {
  let isPaginating = false;
  let currentPage = parseInt(
    new URLSearchParams(window.location.search).get("p") || "1",
  );

  Alpine.directive(
    "pagination-trigger",
    (el, { expression }, { evaluate, cleanup }) => {
      const { lastPage } = evaluate(expression) as Record<string, number>;

      const onClick = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        enableFadeInImages();

        if (isPaginating) {
          return;
        }

        isPaginating = true;
        el.ariaBusy = "1";
        el.dispatchEvent(new CustomEvent("pagination-start"));

        let skeletonHost: HTMLElement | null = null;

        try {
          if (currentPage < lastPage) {
            skeletonHost = showPaginationSkeleton();

            const nextPage = currentPage + 1;
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set("p", nextPage.toString());
            const nextUrl = `${window.location.pathname}?${urlParams.toString()}`;
            const html = await fetchPage(nextUrl);

            removePaginationSkeleton(skeletonHost);
            skeletonHost = null;

            appendPaginationContent(html);
            window.hyva.replaceDomElement("#pager", html);
            cachePage(nextUrl, document.documentElement.outerHTML);
            history.replaceState({ page: nextPage }, "", nextUrl);

            currentPage = nextPage;
          }
        } finally {
          // Le pager a pu être remplacé entre-temps : on nettoie par sélecteur
          // en plus de la référence, pour ne jamais laisser de cartes fantômes.
          removePaginationSkeleton(skeletonHost);
          isPaginating = false;
          el.ariaBusy = "0";
          el.dispatchEvent(new CustomEvent("pagination-end"));
        }
      };

      el.addEventListener("click", onClick);

      cleanup(() => {
        el.removeEventListener("click", onClick);
        isPaginating = false;
        currentPage = parseInt(
          new URLSearchParams(window.location.search).get("p") || "1",
        );
      });
    },
  );
}
