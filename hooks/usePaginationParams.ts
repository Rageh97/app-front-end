import { useControlledSearchParams } from "@/hooks/useControlledSearchParams";
import { PAGE_SIZE } from "@/consts";
import { PaginationResult } from "@/types/pagination-result";

export function usePaginationParams(): PaginationResult {
  const searchParams = useControlledSearchParams();
  const page = parseInt(searchParams.getItem("page")) || 1;
  const page_size = parseInt(searchParams.getItem("page_size")) || PAGE_SIZE;
  return {
    page, // comes from the query params, and it's reactive as opposed to the one that comes from the network request
    page_size, // same as above
    setPage: (page: number) => searchParams.setItem("page", page.toString()),
    setPageSize: (pageSize: number) =>
      searchParams.setItem("page_size", pageSize.toString()),
    params: {
      page,
      page_size,
    },
  };
}
