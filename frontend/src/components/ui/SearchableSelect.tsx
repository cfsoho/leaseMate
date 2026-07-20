import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { passwordManagerIgnoreProps } from "./inputSecurity";

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const selectedIndex = filteredOptions.findIndex(
      (option) => option.value === value,
    );
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [filteredOptions, isOpen, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex, isOpen]);

  function selectOption(option: SearchableSelectOption, focusNext = false) {
    onChange(option.value);
    setIsOpen(false);
    setQuery("");

    if (focusNext) {
      requestAnimationFrame(() => focusNextElement(containerRef.current));
    }
  }

  function moveHighlight(direction: "next" | "previous") {
    if (filteredOptions.length === 0) {
      return;
    }

    setHighlightedIndex((currentIndex) => {
      const safeIndex =
        currentIndex >= 0 && currentIndex < filteredOptions.length
          ? currentIndex
          : 0;

      if (direction === "next") {
        return (safeIndex + 1) % filteredOptions.length;
      }

      return (safeIndex - 1 + filteredOptions.length) % filteredOptions.length;
    });
  }

  function openSelect() {
    if (disabled) {
      return;
    }

    setIsOpen(true);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="lm-searchable-select">
      <button
        ref={buttonRef}
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
        onKeyDown={(event) => {
          if (
            event.key === "ArrowDown" ||
            event.key === "ArrowRight" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowLeft"
          ) {
            event.preventDefault();
            openSelect();
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
              {...passwordManagerIgnoreProps}
              autoFocus
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              className="lm-searchable-select-search-input"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                  event.preventDefault();
                  moveHighlight("next");
                  return;
                }

                if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveHighlight("previous");
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setIsOpen(false);
                  buttonRef.current?.focus();
                  return;
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  const highlightedOption = filteredOptions[highlightedIndex];
                  if (highlightedOption) {
                    selectOption(highlightedOption, true);
                  }
                }
              }}
            />
          </label>
          <div className="lm-searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="lm-searchable-select-empty">
                No matches
              </div>
            ) : (
              filteredOptions.map((option, optionIndex) => (
                <button
                  key={option.value}
                  ref={(element) => {
                    optionRefs.current[optionIndex] = element;
                  }}
                  className={[
                    "lm-searchable-select-option",
                    optionIndex === highlightedIndex
                      ? "lm-searchable-select-option-highlighted"
                      : "",
                    option.value === value
                      ? "lm-searchable-select-option-selected"
                      : "",
                  ].join(" ")}
                  type="button"
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(optionIndex)}
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

function focusNextElement(container: HTMLElement | null) {
  if (!container) {
    return;
  }

  const focusableElements = Array.from(
    document.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(","),
    ),
  ).filter((element) => {
    if (container.contains(element)) {
      return false;
    }

    return (
      Boolean(element.offsetParent || element.getClientRects().length) &&
      Boolean(container.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
  });

  focusableElements[0]?.focus();
}
