import { useLocaleContext } from "./localeContext";

export function useTranslation() {
  return useLocaleContext();
}
