import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type CollapsibleCardContainerContextValue = {
  requestLayoutReflow: () => void;
};

const CollapsibleCardContainerContext =
  createContext<CollapsibleCardContainerContextValue | null>(null);

type CollapsibleCardContainerProps = {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
};

export function CollapsibleCardContainer({
  children,
  className = "",
  header,
}: CollapsibleCardContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestLayoutReflow = useCallback(() => {
    window.requestAnimationFrame(() => {
      void containerRef.current?.offsetHeight;
    });
  }, []);
  const contextValue = useMemo(
    () => ({ requestLayoutReflow }),
    [requestLayoutReflow],
  );

  return (
    <CollapsibleCardContainerContext.Provider value={contextValue}>
      <section className="grid gap-3">
        {header}
        <div
          ref={containerRef}
          className={["lm-card-page grid gap-3 pb-6", className]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </section>
    </CollapsibleCardContainerContext.Provider>
  );
}

export function useCollapsibleCardContainer() {
  return useContext(CollapsibleCardContainerContext);
}
