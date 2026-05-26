import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export type SearchableSelectOption = {
  label: string;
  searchText?: string;
  value: string;
};

type SearchableSelectProps = {
  disabled?: boolean;
  options: SearchableSelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

export function SearchableSelect({
  disabled = false,
  options,
  placeholder = "--",
  value,
  onChange,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.searchText ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-expanded={isOpen}
        className={[
          inputBaseClass,
          "flex items-center justify-between gap-2 text-left font-normal",
          disabled ? "cursor-not-allowed bg-slate-50 opacity-70" : "bg-white",
        ].join(" ")}
        disabled={disabled}
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen((current) => !current);
            setQuery("");
          }
        }}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown aria-hidden="true" className="shrink-0 text-slate-400" size={16} />
      </button>
      {isOpen && (
        <div className="absolute z-30 mt-1 grid max-h-72 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <label className="relative border-b border-slate-100">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              autoFocus
              className="h-10 w-full px-9 text-sm outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm font-semibold text-slate-500">
                No matches
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  className={[
                    "flex min-h-9 w-full items-center rounded-md px-3 text-left text-sm font-semibold hover:bg-slate-100",
                    option.value === value
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-700",
                  ].join(" ")}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setQuery("");
                  }}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputBaseClass =
  "min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10";
