type Paginated<DataT> = {
  count: number;
  next: string | null;
  previous: string | null;
  page_size?: number;
  results: DataT[];
};
