import {replaceMainContentWithTransition} from "@/plugins/Transition";

type PostParams = {
  action: string;
  data: Record<string, string>;
  skipUenc?: boolean;
};

export type FormType = {
  isLoading: boolean;
  errors: number;
  hasCaptchaToken: number;
  displayErrorMessage: boolean | number;
  errorMessages: string[];

  setErrorMessages(messages: string[]): void;
  submitForm(): void;
  postForm(postParams: PostParams): Promise<void>;
};

export const Form = (formId: string, defaultErrorMessage = "") => {
  return <FormType>{
    isLoading: false,
    errors: 0,
    hasCaptchaToken: 0,
    displayErrorMessage: false,
    errorMessages: [],

    setErrorMessages(messages) {
      this.errorMessages = messages;
      this.displayErrorMessage = !!this.errorMessages.length;
    },

    submitForm() {
      const $form = document.getElementById(formId) as HTMLFormElement;
      if (!$form) return;

      const formData = new FormData($form);
      this.isLoading = true;

      const isGetMethod = $form.method.toLowerCase() === "get";
      const query = isGetMethod ? new URLSearchParams(formData as any).toString() : '';
      const formAction = $form.action + `?${query}`;

      fetch(formAction, {
        method: $form.method,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        ...(isGetMethod ? {} : {body: formData})
      })
        .then(async (response) => {
          /*
           * Une reponse non-2xx resout normalement : sans ce garde-fou le .catch ne
           * part pas, replaceMainContentWithTransition ne trouve pas le marqueur
           * <!-- main-content -->, hyva.replaceDomElement sort en silence, et
           * l'utilisateur n'a ni message ni action serveur. C'est ce qui arrive quand
           * l'edge intercepte le XHR avant Magento (Cloudflare : 403 cf-mitigated).
           */
          if (!response.ok) {
            throw new Error(
              `${response.status} ${response.statusText} on ${response.url}`
            );
          }

          await replaceMainContentWithTransition(
            response.url,
            await response.text()
          );
        })
        .catch((error) => {
          console.error("Form submission failed:", error);
          this.setErrorMessages([
            defaultErrorMessage ||
              "An error occurred, please try again or reload the page.",
          ]);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    async postForm(postParams) {
      this.isLoading = true;

      const form = document.createElement("form");

      let data = postParams.data;

      if (!postParams.skipUenc && !data.uenc) {
        data.uenc = btoa(window.location.href);
      }
      form.method = "POST";
      form.action = postParams.action;

      Object.keys(postParams.data).map(key => {
        const field = document.createElement("input");
        field.type = "hidden";
        field.value = postParams.data[key];
        field.name = key;
        form.appendChild(field);
      });

      const form_key = document.createElement("input");
      form_key.type = "hidden";
      form_key.value = window.hyva.getFormKey();
      form_key.name = "form_key";
      form.appendChild(form_key);

      return fetch(form.action, {
        method: "POST",
        body: new FormData(form),
      })
        .then(async (response) => {
          /*
           * Une reponse non-2xx resout normalement : sans ce garde-fou le .catch ne
           * part pas, replaceMainContentWithTransition ne trouve pas le marqueur
           * <!-- main-content -->, hyva.replaceDomElement sort en silence, et
           * l'utilisateur n'a ni message ni action serveur. C'est ce qui arrive quand
           * l'edge intercepte le XHR avant Magento (Cloudflare : 403 cf-mitigated).
           */
          if (!response.ok) {
            throw new Error(
              `${response.status} ${response.statusText} on ${response.url}`
            );
          }

          await replaceMainContentWithTransition(
            response.url,
            await response.text()
          );
        })
        .catch((error) => {
          console.error("Form submission failed", error);
          this.setErrorMessages([
            defaultErrorMessage ||
              "An error occurred, please try again or reload the page.",
          ]);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
  };
};
