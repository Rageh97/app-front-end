import React from "react";
import { render, cleanup } from "@testing-library/react";
import { expect, describe, it, afterEach } from "vitest";
import Table from "@/components/Table";

const MOCK_DATA = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Doe" },
];

describe("Table", () => {
  afterEach(() => {
    cleanup();
  });

  it("Table renders", () => {
    const screen = render(<Table columns={[]} data={[]} />);
    expect(screen.getByRole("table")).toBeDefined();
  });

  it("Table renders with correct column configuration", () => {
    const screen = render(
      <Table
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "ID", accessorKey: "id" },
        ]}
        data={MOCK_DATA}
      />
    );
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("ID")).toBeDefined();
  });

  it("Table renders with 1 header 2 rows", () => {
    const screen = render(
      <Table
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "ID", accessorKey: "id" },
        ]}
        data={MOCK_DATA}
      />
    );
    expect(screen.container.querySelectorAll("thead > tr").length).toBe(1);
    expect(screen.container.querySelectorAll("tbody > tr").length).toBe(2);
  });
});
