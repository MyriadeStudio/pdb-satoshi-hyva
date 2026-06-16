const { spacing } = require("tailwindcss/defaultTheme");

const colors = require("tailwindcss/colors");

const hyvaModules = require("@hyva-themes/hyva-modules");

const defaultWidthHeight = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
};

module.exports = hyvaModules.mergeTailwindConfig({
  theme: {
    extend: {
      aspectRatio: {
        product: "var(--product-aspect-ratio)",
      },
      boxShadow: {
        outline: "0 0 0 3px rgba(66, 153, 225, 0.6)",
        input: "0 0 0 1px var(--color-primary)",
        error: "0 0 0 1px rgb(229, 62, 62)",
        fadeTop: "0px -10px 15px #00000010",
      },
      colors: {
        // --- Utilitaires Satoshi (hors design-system PDB) ---
        placeholder: "#718096",
        "border-color": "#e2e8f0",
        shadow: "#00000033",
        overlay: "#18181833",
        "overlay-dark": "#18181866",
        "primary-bg": "#181818",
        "text-on-primary-bg": "#FFFFFF",
        error: "#B40C1C",

        // --- Tokens sémantiques Pdb_ThemeHyva (BO → :root via default_head_blocks.xml) ---
        bg: {
          DEFAULT: "var(--color-bg)",
          alt: "var(--color-bg-alt)",
          // fond/bordure neutre légèrement plus foncé que le fond de page (panneaux creusés, séparateurs)
          // fallback sur --color-bg pour rétro-compatibilité (token non émis : ancien module, cache non vidé…)
          sunken: "var(--color-bg-sunken, var(--color-bg))",
        },
        fg: {
          DEFAULT: "var(--color-fg)",
          alt: "var(--color-fg-alt)",
          // texte discret/secondaire
          secondary: "var(--color-fg-secondary)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          hover: "var(--color-surface-hover)",
        },
        // primary = couleur d'accent (doit attirer l'attention)
        primary: {
          DEFAULT: "var(--color-primary)",
          lighter: "var(--color-primary-lighter)",
          darker: "var(--color-primary-darker)",
          on: "var(--color-primary-on)",
          hover: "var(--color-primary-hover)",
          "hover-on": "var(--color-primary-hover-on)",
        },
        // secondary = accent secondaire (réservé à l'accentuation, PAS aux fonds neutres)
        secondary: {
          DEFAULT: "var(--color-secondary)",
          lighter: "var(--color-secondary-lighter)",
          darker: "var(--color-secondary-darker)",
          on: "var(--color-secondary-on)",
          hover: "var(--color-secondary-hover)",
          "hover-on": "var(--color-secondary-hover-on)",
        },
        on: {
          primary: "var(--color-primary-on)",
          secondary: "var(--color-secondary-on)",
          image: "var(--color-on-image)",
        },
      },
      borderWidth: {
        1: "1px",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
      },
      spacing: {
        1: "2px",
        2: "4px",
        3: "8px",
        4: "12px",
        5: "16px",
        6: "20px",
        7: "24px",
      },
      screens: {
        "max-2xl": { max: "1535px" },
        "max-xl": { max: "1279px" },
        "max-lg": { max: "1023px" },
        "max-md": { max: "767px" },
        "max-sm": { max: "639px" },
      },
      width: defaultWidthHeight,
      height: defaultWidthHeight,
      minWidth: defaultWidthHeight,
      minHeight: defaultWidthHeight,
      maxWidth: {
        screen: "100vw",
      },
      fontFamily: {
        heading: "var(--font-heading-family)",
        body: "var(--font-body-family)",
      },
      fontWeight: {
        "w-heading": "var(--font-heading-weight)",
        "w-body": "var(--font-body-weight)",
      },
      fontSize: {
        "2xs": "0.625rem",
        xs: "0.75rem",
        sm: "12px",
        md: "16px",
        lg: "18px",
        xl: "20px",
        xxl: "24px",
      },
      transitionDelay: {
        150: "150ms",
        450: "450ms",
      },
      gridTemplateColumns: {
        header: "40px 40px 1fr 40px 40px",
        addressForms: "repeat(auto-fit, 400px)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIconIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideTitleIn: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(var(--translate-width))" },
        },
        slideIconOut: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        slideTitleOut: {
          "0%": { transform: "translateX(var(--translate-width))" },
          "100%": { transform: "translateX(0)" },
        },
        pop: {
          "50%": { transform: "scale(0.95)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 500ms forwards",
        slideIconIn: "slideIconIn 300ms forwards",
        slideIconOut: "slideIconOut 300ms forwards",
        slideTitleIn: "slideTitleIn 300ms forwards",
        slideTitleOut: "slideTitleOut 300ms forwards",
        pop: "pop 300ms ease-in-out forwards",
      },
    },
  },
  // plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
  content: [
    // this theme's phtml and layout XML files
    "../../../**/*.phtml",
    "../../../**/*.xml",
    // parent theme in Vendor (if this is a child-theme)
    "../../../../../../hyva-themes/magento2-default-theme/**/*.phtml",
    "../../../../../../hyva-themes/magento2-default-theme/*/layout/*.xml",
    "../../../../../../hyva-themes/magento2-default-theme/*/page_layout/override/base/*.xml",
  ],
});
