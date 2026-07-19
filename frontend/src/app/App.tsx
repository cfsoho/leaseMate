import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";

import { appBrand } from "../config/appBrand";
import { router } from "./router";

export function App() {
  useEffect(() => {
    document.title = appBrand.name;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", appBrand.description);
  }, []);

  return <RouterProvider router={router} />;
}
