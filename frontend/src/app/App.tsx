import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";

import { appBrand } from "../config/appBrand";
import { applyPasswordManagerIgnoreAttributes } from "../components/ui/inputSecurity";
import { router } from "./router";

export function App() {
  useEffect(() => {
    document.title = appBrand.name;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", appBrand.description);
  }, []);

  useEffect(() => {
    applyPasswordManagerIgnoreAttributes(document);

    const observer = new MutationObserver(() => {
      applyPasswordManagerIgnoreAttributes(document);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return <RouterProvider router={router} />;
}
