import React, { FunctionComponent } from "react";

const DEFAULT_ADJACENT_PAGES_SHOWN = 1;

export type PaginationProps = {
  page: number;
  totalPages: number;
  adjacentPagesShown?: number;
  onClick: (page: number) => void;
  disabled?: boolean;
};

const usePagination = (props: PaginationProps) => {
  const {
    page,
    totalPages,
    adjacentPagesShown = DEFAULT_ADJACENT_PAGES_SHOWN,
  } = props;
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const isShowFirstEllipsis = page > 3;
  const isShowLastEllipsis = page < totalPages - 2;
  const isShowFirstPage = page > 1 + adjacentPagesShown;
  const isShowLastPage = page < totalPages - adjacentPagesShown;

  return {
    isFirstPage,
    isLastPage,
    pages,
    isShowFirstEllipsis,
    isShowLastEllipsis,
    isShowFirstPage,
    isShowLastPage,
  };
};

const Pagination: FunctionComponent<PaginationProps> = (props) => {
  const { adjacentPagesShown = DEFAULT_ADJACENT_PAGES_SHOWN } = props;
  const {
    isFirstPage,
    isLastPage,
    pages,
    isShowFirstEllipsis,
    isShowLastEllipsis,
    isShowFirstPage,
    isShowLastPage,
  } = usePagination(props);
  const onClick = props.disabled ? () => {} : props.onClick;
  return (
    <div>
      <nav>
        <ul className="flex flex-wrap items-center gap-2">
          {isFirstPage ? (
            <li className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EDEFF1] text-xs font-medium text-black">
              Vorige
              {/* Previous */}
            </li>
          ) : (
            <li>
              <button
                onClick={() => onClick(props.page - 1)}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EDEFF1] text-xs font-medium text-black hover:bg-primary hover:text-white"
              >
                Vorige
                {/* Previous */}
              </button>
            </li>
          )}
          {isShowFirstPage && (
            <li>
              <button
                onClick={() => onClick(1)}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EDEFF1] text-xs font-medium text-black hover:bg-primary hover:text-white"
              >
                1
              </button>
            </li>
          )}
          {isShowFirstEllipsis && (
            <li>
              <button className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EDEFF1] text-xs font-medium text-black">
                ...
              </button>
            </li>
          )}
          {pages.map((page) => {
            if (
              Math.abs(page - props.page) <= adjacentPagesShown ||
              page === props.page
            ) {
              return (
                <li key={page}>
                  <button
                    onClick={() => onClick(page)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md ${
                      page === props.page
                        ? "bg-primary text-white"
                        : "bg-[#EDEFF1] text-black hover:bg-primary hover:text-white"
                    } text-xs font-medium`}
                  >
                    {page}
                  </button>
                </li>
              );
            }
            return null;
          })}
          {isShowLastEllipsis && (
            <li>
              <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EDEFF1] text-xs font-medium text-black">
                ...
              </span>
            </li>
          )}
          {isShowLastPage && (
            <li>
              <button
                onClick={() => onClick(pages.length)}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EDEFF1] text-xs font-medium text-black hover:bg-primary hover:text-white"
              >
                {pages.length}
              </button>
            </li>
          )}
          {isLastPage ? (
            <li className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EDEFF1] text-xs font-medium text-black">
              Volgende
              {/* Next */}
            </li>
          ) : (
            <li>
              <button
                onClick={() => onClick(props.page + 1)}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EDEFF1] text-xs font-medium text-black hover:bg-primary hover:text-white"
              >
                Volgende
                {/* Next */}
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
