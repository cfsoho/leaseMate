export const passwordManagerIgnoreProps = {
  "data-1p-ignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
  "data-lpignore": "true",
} as const;

const passwordManagerIgnoreAttributes = Object.entries(
  passwordManagerIgnoreProps,
);

export function applyPasswordManagerIgnoreAttributes(root: ParentNode) {
  root
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select",
    )
    .forEach((element) => {
      passwordManagerIgnoreAttributes.forEach(([attribute, value]) => {
        element.setAttribute(attribute, value);
      });
      element.setAttribute("autocomplete", "off");
    });
}
