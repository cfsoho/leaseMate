import { useEffect, useState } from "react";

const GRID_SCROLL_OFFSET_PX = 260;
const GRID_HEADER_HEIGHT_PX = 42;
const GRID_ROW_HEIGHT_PX = 45;
const MIN_PAGE_SIZE = 10;

export function useDataGridPageSize() {
  const [pageSize, setPageSize] = useState(calculatePageSize);

  useEffect(() => {
    function handleResize() {
      setPageSize(calculatePageSize());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return pageSize;
}

function calculatePageSize() {
  if (typeof window === "undefined") {
    return MIN_PAGE_SIZE;
  }

  const scrollAreaHeight = window.innerHeight - GRID_SCROLL_OFFSET_PX;
  const availableBodyHeight = scrollAreaHeight - GRID_HEADER_HEIGHT_PX;

  return Math.max(
    MIN_PAGE_SIZE,
    Math.floor(availableBodyHeight / GRID_ROW_HEIGHT_PX),
  );
}
