import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import type { DataGridSortState } from "./dataTypes";

const defaultPageParam = "page";
const defaultSortParam = "sort";
const defaultDirectionParam = "dir";

type UrlDataGridStateOptions = {
  directionParam?: string;
  pageParam?: string;
  sortParam?: string;
};

export function useUrlDataGridState(options: UrlDataGridStateOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = options.pageParam ?? defaultPageParam;
  const sortParam = options.sortParam ?? defaultSortParam;
  const directionParam = options.directionParam ?? defaultDirectionParam;
  const pageIndex = Math.max(Number(searchParams.get(pageParam) ?? "1") - 1, 0);
  const sortColumn = searchParams.get(sortParam);
  const sortDirection = searchParams.get(directionParam);
  const sortState: DataGridSortState =
    sortColumn && (sortDirection === "asc" || sortDirection === "desc")
      ? { columnKey: sortColumn, direction: sortDirection }
      : null;

  const updateParams = useCallback(
    (updater: (nextParams: URLSearchParams) => void) => {
      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams);
          updater(nextParams);
          return nextParams;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPageIndex = useCallback(
    (nextPageIndex: number) => {
      updateParams((nextParams) => {
        const nextPage = Math.max(nextPageIndex, 0) + 1;

        if (nextPage === 1) {
          nextParams.delete(pageParam);
          return;
        }

        nextParams.set(pageParam, String(nextPage));
      });
    },
    [pageParam, updateParams],
  );

  const setSortState = useCallback(
    (nextSortState: DataGridSortState) => {
      updateParams((nextParams) => {
        nextParams.delete(pageParam);

        if (!nextSortState) {
          nextParams.delete(sortParam);
          nextParams.delete(directionParam);
          return;
        }

        nextParams.set(sortParam, nextSortState.columnKey);
        nextParams.set(directionParam, nextSortState.direction);
      });
    },
    [directionParam, pageParam, sortParam, updateParams],
  );

  return {
    pageIndex,
    setPageIndex,
    setSortState,
    sortState,
  };
}
