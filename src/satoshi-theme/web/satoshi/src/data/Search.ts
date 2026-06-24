import type { Magics } from "alpinejs";
import { navigateWithTransition } from "@/plugins/Transition";

export type SearchType = {
  [key: string | symbol]: any;

  isLoading: boolean;
  searchTerm: string;
  searchTermInput: string;
  suggestions: [];
  products: [];
  categories: [];
  isNoResults: boolean;
  productsSearchLimit: number;

  init(): void;
  getIsSearchActive(): boolean;
  setSearchTerm(): void;
  resetSearchTerm(): void;
  search(): void;
  getSearchUrl(path: string): string;
  goToSearchPage(path: string): void;
} & Magics<{}>;

const initialSearch = new URLSearchParams(window.location.search).get("q");

// Endpoint de suggestions partagé avec Pdb_ThemeHyva (module app/code/Pdb/ThemeHyva,
// route disponible quel que soit le thème). Remplace l'ancienne requête GraphQL
// (champ products.suggestions = Live Search natif, indisponible ici).
const SUGGEST_ENDPOINT = "/pdb_themehyva/search/suggest";

// Convertit une URL produit absolue en chemin relatif sans slash initial,
// pour coller au format attendu par item.phtml (`/${product.url_rewrites[0].url}`).
const toRelativeUrl = (url: string): string => {
  try {
    return new URL(url, window.location.origin).pathname.replace(/^\/+/, "");
  } catch {
    return String(url).replace(/^\/+/, "");
  }
};

// Remappe un produit de la réponse plate du contrôleur vers la forme « GraphQL »
// attendue par les templates Satoshi (search-products / item.phtml).
const mapProduct = (product: any) => {
  const image = product.image || {};
  const finalPrice = Number(product.final_price ?? 0);
  const regularPrice = Number(product.regular_price ?? finalPrice);
  const priceTier = {
    regular_price: { value: regularPrice },
    final_price: { value: finalPrice },
    value: finalPrice,
  };

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    url_rewrites: [{ url: toRelativeUrl(String(product.url || "")) }],
    image: { url: image.url, label: image.label },
    media_gallery: image.url ? [{ url: image.url, label: image.label }] : [],
    price_range: {
      minimum_price: priceTier,
      maximum_price: priceTier,
    },
  };
};

export const Search = () =>
  <SearchType>{
    isLoading: false,
    searchTerm: initialSearch || "",
    searchTermInput: initialSearch || "",
    suggestions: [],
    products: [],
    categories: [],
    isNoResults: false,
    productsSearchLimit: 4,

    getIsSearchActive() {
      return !!this.searchTerm.length;
    },

    init() {
      if (this.searchTerm) {
        this.search();
      }

      this.$watch("searchTerm", (value) => {
        if (value) {
          this.search();
        }
      });
    },

    setSearchTerm() {
      if (this.searchTerm.trim() !== this.searchTermInput.trim()) {
        this.isLoading = true;
      }

      this.searchTerm = this.searchTermInput.trim();
    },

    resetSearchTerm() {
      this.searchTermInput = "";
      this.setSearchTerm();
      this.isLoading = false;
    },

    search() {
      this.isLoading = true;

      const url =
        SUGGEST_ENDPOINT +
        "?" +
        new URLSearchParams({
          q: this.searchTerm,
          limit: String(this.productsSearchLimit),
        });

      fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
        .then((response) => response.json())
        .then((data) => {
          const products = Array.isArray(data?.products) ? data.products : [];
          const suggestions = Array.isArray(data?.suggestions)
            ? data.suggestions
            : [];
          const categories = Array.isArray(data?.categories)
            ? data.categories
            : [];

          this.products =
            this.searchTerm.length >= 3 ? products.map(mapProduct) : [];
          this.suggestions = suggestions;
          this.categories = categories;
          this.isNoResults =
            !this.suggestions.length &&
            !this.products.length &&
            !this.categories.length;
        })
        .catch((error) => console.error("Error:", error))
        .finally(() => (this.isLoading = false));
    },

    goToSearchPage(path) {
      navigateWithTransition(this.getSearchUrl(path), {
        type: "search",
        animate: true,
        data: {
          q: this.searchTermInput,
        },
      });
    },

    getSearchUrl(path) {
      return this.searchTermInput
        ? `${path}?q=${encodeURIComponent(this.searchTermInput.trim())}`
        : path;
    },
  };
