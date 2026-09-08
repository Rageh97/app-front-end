import React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaginatedTable from "@/components/PaginatedTable";

const columns = [
  { header: "Name", accessorKey: "name" },
];

describe("PaginatedTable", () => {
  afterEach(cleanup);

  it("renders paginated rows and changes page", () => {
    const onPageChange = vi.fn();
    const view = render(
      <PaginatedTable
        page={1}
        onPageChange={onPageChange}
        columns={columns}
        data={{ count: 3, page_size: 2, next: null, previous: null, results: [{ id: 1, name: "First row" }] }}
      />
    );

    expect(view.getAllByText("First row")).toHaveLength(2);
    fireEvent.click(view.getAllByRole("button", { name: "2" })[0]);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("shows the configured empty-state message", () => {
    const view = render(
      <PaginatedTable
        page={1}
        onPageChange={() => undefined}
        columns={columns}
        alertMessage="No records yet"
        data={{ count: 0, page_size: 10, next: null, previous: null, results: [] }}
      />
    );

    expect(view.getByText("No records yet")).toBeDefined();
  });
});
