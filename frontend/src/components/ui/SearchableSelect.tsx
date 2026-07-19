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
    <div ref={containerRef} className="lm-searchable-select">
      <button
        aria-expanded={isOpen}
        className={[
          "lm-form-input",
          "lm-searchable-select-button",
          disabled ? "lm-searchable-select-button-disabled" : "",
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
        <span className="lm-searchable-select-text">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="lm-searchable-select-icon"
          size={16}
        />
      </button>
      {isOpen && (
        <div className="lm-searchable-select-menu">
          <label className="lm-searchable-select-search">
            <Search
              aria-hidden="true"
              className="lm-searchable-select-search-icon"
              size={16}
            />
            <input
              autoFocus
              className="lm-searchable-select-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="lm-searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="lm-searchable-select-empty">
                No matches
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  className={[
                    "lm-searchable-select-option",
                    option.value === value
                      ? "lm-searchable-select-option-selected"
                      : "",
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
