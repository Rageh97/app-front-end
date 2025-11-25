export type PaginationResult = {
  page: number;
  page_size: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  params: {
    page: number;
    page_size: number;
  };
};

export type WithPaginationResult<T> = T & {
  pagination: PaginationResult;
};
