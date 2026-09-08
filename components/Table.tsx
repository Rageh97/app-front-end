import React, { Fragment, useMemo, useState, HTMLAttributes } from "react";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  Row,
} from "@tanstack/table-core";
import { flexRender, useReactTable } from "@tanstack/react-table";
import ChevronDown from "@/components/icons/ChevronDown";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";

const debugTable = process.env.NODE_ENV === "development";

export type TableProps<InstanceType> = {
  data: InstanceType[];
  columns: ColumnDef<InstanceType>[];
  onRowClick?: (instance: InstanceType) => void;
  className?: string;
  renderRowDetails?: (row: Row<InstanceType>) => React.ReactNode;
};

function Table<T>({
  data,
  columns: columnDefs,
  onRowClick,
  className,
  renderRowDetails,
}: TableProps<T>) {
  const [showRowDetails, setShowRowDetails] = useState<Row<T>>();

  const columns = useMemo<ColumnDef<T>[]>(() => {
    if (!renderRowDetails) {
      return columnDefs;
    }
    const columnHelper = createColumnHelper<T>();
    return [
      ...columnDefs,
      columnHelper.display({
        id: "expand",
        cell: ({ row }) => {
          return (
            <div className="flex justify-end w-full">
              <ChevronDown
                width={36}
                height={36}
                className={clsx({
                  "rotate-[-90deg]": row.getIsExpanded(),
                })}
              />
            </div>
          );
        },
      }),
    ];
  }, [columnDefs, renderRowDetails]);

  const table = useReactTable({
    columns,
    data,
    // TODO: PASS THIS AS A FUNCTION FROM PROPS
    //@ts-ignore
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable,
    manualPagination: true,
    getRowCanExpand: () => !!renderRowDetails,
    getIsRowExpanded: (row) => row.id === showRowDetails?.id,
  });
  return (
   
<div className="overflow-x-auto rounded-2xl dark:border dark:border-zinc-800/80 dark:bg-[#0E1017]">
  <table
    className={clsx(
      "w-full table-auto border-spacing-y-3 border-separate dark:border-separate-0 dark:border-collapse text-white datatable-one",
      className
    )}
  >
    {/* رأس الجدول */}
    <thead className="bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] dark:bg-[#12141F] dark:border-b dark:border-zinc-800">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header, i) => (
            <th
              key={header.id}
              className={clsx(
                "px-2 py-2 md:py-4 dark:px-6 dark:py-4 dark:text-zinc-400 dark:font-semibold dark:text-xs dark:uppercase dark:tracking-wider dark:text-center",
                i === 0 && "rounded-tl-xl rounded-bl-xl dark:rounded-none overflow-hidden",
                i === headerGroup.headers.length - 1 && "rounded-tr-xl rounded-br-xl dark:rounded-none overflow-hidden"
              )}
            >
              <div
                {...{
                  className:
                    "flex items-center justify-center rounded-lg relative inner-shadow dark:inner-shadow-none bg-[#35214f] dark:bg-transparent dark:px-0 dark:py-0 px-3 py-3 text-xs md:text-sm text-center shadow-md dark:shadow-none" +
                    (header.column.getCanSort() ? " cursor-pointer select-none" : ""),
                  onClick: header.column.getToggleSortingHandler(),
                }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
                <span className="absolute right-1 top-1 dark:static dark:ml-1">
                  {{
                    asc: <ChevronDown className="rotate-180 text-orange dark:text-[#00c48c]" />,
                    desc: <ChevronDown className="text-orange dark:text-[#00c48c]" />,
                  }[header.column.getIsSorted() as string] ?? null}
                </span>
              </div>
            </th>
          ))}
        </tr>
      ))}
    </thead>

    {/* جسم الجدول */}
    <tbody className="dark:divide-y dark:divide-zinc-800/60">
      {table.getRowModel().rows.map((row) => (
        <Fragment key={row.id}>
          <tr 
            className="group dark:hover:bg-[#151824] transition-colors duration-150 cursor-pointer"
            onClick={() => {
              onRowClick?.(row.original);
              setShowRowDetails((r) =>
                !row.getCanExpand() ? r : r?.id === row.id ? undefined : row
              );
            }}
          >
            {/* Dark mode direct table cells layout */}
            {row.getVisibleCells().map((cell, cellIdx) => (
              <td
                key={cell.id}
                className="hidden dark:table-cell px-6 py-5 text-sm text-center text-zinc-200 align-middle font-medium border-b border-zinc-800/50"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}

            {/* Light mode original card row wrapper */}
            <td colSpan={row.getVisibleCells().length} className="p-0 dark:hidden">
              <div className="flex items-center gap-2">
                <div
                  className="w-full flex items-center rounded-xl border border-orange bg-[linear-gradient(135deg,rgba(79,0,140,0.54),rgba(25,2,55,0.5),rgba(25,2,55,0.3))] shadow-md cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="flex-1 px-1 md:px-4 py-2 md:py-4 text-xs md:text-sm text-center"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              </div>
            </td>
          </tr>

          {row.getCanExpand() && row.getIsExpanded() && (
            <tr>
              <td
                colSpan={row.getVisibleCells().length}
                className="border-t-2 bg-gray-3 dark:bg-[#12141F] dark:border-zinc-800 p-4"
              >
                {renderRowDetails?.(row)}
              </td>
            </tr>
          )}
        </Fragment>
      ))}
    </tbody>
  </table>
</div>

    
  
  );
}

export default Table;
