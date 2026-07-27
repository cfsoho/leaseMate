import { Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useLocaleContext } from "../../lib/i18n/localeContext";
import { localeOptionLabels, supportedLocales } from "../../lib/i18n/translations";

export function AuthLanguageSelector() {
  const { locale, setLocale } = useLocaleContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed right-4 top-4 z-50">
      <button
        aria-expanded={isOpen}
        aria-label="Language"
        className="grid size-9 place-items-center rounded-full bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Globe2 aria-hidden="true" size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 grid min-w-48 gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          {supportedLocales.map((supportedLocale) => (
            <button
              key={supportedLocale}
              className={[
                "rounded-md px-3 py-2 text-left text-sm font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                supportedLocale === locale ? "bg-slate-950 text-white hover:bg-slate-950 hover:text-white" : "",
              ].join(" ")}
              type="button"
              onClick={() => {
                setLocale(supportedLocale);
                setIsOpen(false);
              }}
            >
              {localeOptionLabels[supportedLocale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
