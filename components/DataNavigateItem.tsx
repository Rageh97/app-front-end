import { FunctionComponent } from "react";

interface DataNavigateItemProps {
  isFetching: boolean;
  page: number;
  setPage: Function;
  data: any;
}

const DataNavigateItem: FunctionComponent<DataNavigateItemProps> = ({
  isFetching,
  page,
  setPage,
  data,
}) => {
  return (
    <div className="flex gap-4 justify-center items-center">
      {isFetching && (
        <div className="inline-block h-[1.1rem] w-[1.1rem] animate-spin rounded-full border-[3px] border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      )}
      <button
      className="text-orange text-xs md:text-sm"
        disabled={page === 1 || isFetching}
        onClick={() => {
          setPage(page - 1);
        }}
      >
        Previous
      </button>
      {data?.currentPage}/{data?.totalPages === 0 ? 1 : data?.totalPages}
      <button
      className="text-orange text-xs md:text-sm"
        disabled={
          page === (data?.totalPages === 0 ? 1 : data?.totalPages) || isFetching
        }
        onClick={() => {
          setPage(page + 1);
        }}
      >
        Next
      </button>
    </div>
  );
};

export default DataNavigateItem;
