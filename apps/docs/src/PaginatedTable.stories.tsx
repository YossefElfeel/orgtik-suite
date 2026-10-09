import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Field, Input, NumberField } from "@orgtik/ui";
import { PaginatedTable } from "@orgtik/ui/table";

function SpecializedTable() {
  const [count, setCount] = useState(101);
  const [search, setSearch] = useState("");
  const [descending, setDescending] = useState(false);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const rows = Array.from({ length: count }, (_, index) => ({
    id: index,
    name: `Record ${String(index).padStart(3, "0")}`,
  }))
    .filter((row) => row.name.includes(search))
    .sort((a, b) => (descending ? b.id - a.id : a.id - b.id));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Record count">
          <NumberField
            min={0}
            max={101}
            value={count}
            onValueChange={(value) => setCount(value ?? 0)}
          />
        </Field>
        <Field label="Search records">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
        <Button
          variant="secondary"
          onClick={() => setDescending((value) => !value)}
        >
          Reverse order
        </Button>
        <Button
          variant="danger"
          disabled={!count}
          onClick={() => setCount((value) => value - 1)}
        >
          Delete last record
        </Button>
      </div>
      <PaginatedTable resetKey={`${search}/${descending}`}>
        <table className="w-full text-body-sm">
          <caption className="sr-only">Specialized records</caption>
          <thead>
            <tr>
              <th scope="col" className="p-3 text-start">
                Record
              </th>
              <th scope="col" className="p-3 text-start">
                Editable note
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <th scope="row" className="p-3 text-start">
                  {row.name}
                </th>
                <td className="p-3">
                  <Input
                    aria-label={`Note for ${row.name}`}
                    value={edits[row.id] ?? ""}
                    onChange={(event) =>
                      setEdits((previous) => ({
                        ...previous,
                        [row.id]: event.target.value,
                      }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="p-3">
                Summary stays visible on every page.
              </td>
            </tr>
          </tfoot>
        </table>
      </PaginatedTable>
    </div>
  );
}

const meta: Meta<typeof SpecializedTable> = {
  title: "Data/PaginatedTable",
  component: SpecializedTable,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof SpecializedTable>;
export const Legacy: Story = {};
