import {
  Children,
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  isValidElement,
  type ReactElement,
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
  layout?: "grid" | "masonry";
};

export function CollapsibleCardContainer({
  children,
  className = "",
  header,
  layout = "grid",
}: CollapsibleCardContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [layoutTick, setLayoutTick] = useState(0);
  const requestLayoutReflow = useCallback(() => {
    window.requestAnimationFrame(() => {
      void containerRef.current?.offsetHeight;
      setLayoutTick((current) => current + 1);
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
        {layout === "masonry" ? (
          <MeasuredMasonry
            className={className}
            containerRef={containerRef}
            layoutTick={layoutTick}
          >
            {children}
          </MeasuredMasonry>
        ) : (
          <div
            ref={containerRef}
            className={["lm-card-page grid gap-3 pb-6", className]
              .filter(Boolean)
              .join(" ")}
          >
            {children}
          </div>
        )}
      </section>
    </CollapsibleCardContainerContext.Provider>
  );
}

export function useCollapsibleCardContainer() {
  return useContext(CollapsibleCardContainerContext);
}

type MeasuredMasonryProps = {
  children: ReactNode;
  className: string;
  containerRef: { current: HTMLDivElement | null };
  layoutTick: number;
};

function MeasuredMasonry({
  children,
  className,
  containerRef,
  layoutTick,
}: MeasuredMasonryProps) {
  const columnCount = useMasonryColumnCount();
  const items = useMemo(() => flattenChildren(children), [children]);
  const itemRefs = useRef(new Map<number, HTMLDivElement>());
  const [heights, setHeights] = useState<Record<number, number>>({});

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      setHeights((currentHeights) => {
        let didChange = false;
        const nextHeights = { ...currentHeights };

        entries.forEach((entry) => {
          const index = Number(
            (entry.target as HTMLElement).dataset.masonryIndex,
          );
          const nextHeight = Math.ceil(entry.contentRect.height);

          if (!Number.isNaN(index) && nextHeights[index] !== nextHeight) {
            nextHeights[index] = nextHeight;
            didChange = true;
          }
        });

        return didChange ? nextHeights : currentHeights;
      });
    });

    itemRefs.current.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [columnCount, items.length, layoutTick]);

  const hasMeasuredEveryItem =
    items.length > 0 && items.every((_, index) => (heights[index] ?? 0) > 0);

  const columns = useMemo(() => {
    const nextColumns = Array.from({ length: columnCount }, () => ({
      height: 0,
      items: [] as Array<{ item: ReactNode; index: number }>,
    }));

    items.forEach((item, index) => {
      const targetColumn = hasMeasuredEveryItem
        ? nextColumns.reduce(
            (shortestColumnIndex, column, columnIndex) =>
              column.height < nextColumns[shortestColumnIndex].height
                ? columnIndex
                : shortestColumnIndex,
            0,
          )
        : index % columnCount;

      nextColumns[targetColumn].items.push({ item, index });
      nextColumns[targetColumn].height += heights[index] ?? 0;
    });

    return nextColumns;
  }, [columnCount, hasMeasuredEveryItem, heights, items]);

  return (
    <div
      ref={(element) => {
        containerRef.current = element;
      }}
      className={["lm-card-page lm-card-page-masonry pb-6", className]
        .filter(Boolean)
        .join(" ")}
    >
      {columns.map((column, columnIndex) => (
        <div className="lm-card-page-masonry-column" key={columnIndex}>
          {column.items.map(({ item, index }) => (
            <div
              className="lm-card-page-masonry-item"
              data-masonry-index={index}
              key={getMasonryItemKey(item, index)}
              ref={(element) => {
                if (element) {
                  itemRefs.current.set(index, element);
                  return;
                }

                itemRefs.current.delete(index);
              }}
            >
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function useMasonryColumnCount() {
  const [columnCount, setColumnCount] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1536px)").matches
      ? 2
      : 1,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1536px)");
    const syncColumnCount = () => setColumnCount(mediaQuery.matches ? 2 : 1);

    syncColumnCount();
    mediaQuery.addEventListener("change", syncColumnCount);

    return () => mediaQuery.removeEventListener("change", syncColumnCount);
  }, []);

  return columnCount;
}

function flattenChildren(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      child.type === Fragment
    ) {
      result.push(
        ...flattenChildren(
          (child as ReactElement<{ children?: ReactNode }>).props.children,
        ),
      );
      return;
    }

    if (child !== null && child !== undefined && child !== false) {
      result.push(child);
    }
  });

  return result;
}

function getMasonryItemKey(item: ReactNode, index: number) {
  return isValidElement(item) && item.key != null ? item.key : index;
}
