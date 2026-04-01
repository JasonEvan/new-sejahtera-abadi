import db from "@/lib/drizzle";
import { AppError } from "@/lib/errors";
import { sql as drizzleSql } from "drizzle-orm";

type CsvCell = string | number | null | undefined;

export const STOCK_EXPORT_COLUMNS = {
  name: { header: "nama", dbColumn: "name" },
  initial_stock: { header: "stock_awal", dbColumn: "initial_stock" },
  ending_stock: { header: "stock_akhir", dbColumn: "ending_stock" },
  product_price: { header: "harga_barang", dbColumn: "product_price" },
  qty_in: { header: "qty_in", dbColumn: "qty_in" },
  qty_out: { header: "qty_out", dbColumn: "qty_out" },
  selling_price: { header: "harga_jual", dbColumn: "selling_price" },
  unit: { header: "satuan", dbColumn: "unit" },
  capital_cost: { header: "modal", dbColumn: "capital_cost" },
} as const;

export type StockExportColumn = keyof typeof STOCK_EXPORT_COLUMNS;

const DEFAULT_BATCH_SIZE = 1000;

function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);
  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

async function getStockRowsChunk(
  selectedColumns: StockExportColumn[],
  lastId: number,
  limit: number,
): Promise<Array<Record<string, CsvCell> & { id: number }>> {
  const selectedDbColumns = selectedColumns
    .map((column) => `"${STOCK_EXPORT_COLUMNS[column].dbColumn}"`)
    .join(", ");

  const query = drizzleSql.raw(
    `SELECT id, ${selectedDbColumns} FROM "stocks" WHERE id > ${lastId} ORDER BY id ASC LIMIT ${limit}`,
  );

  const rows = await db.execute(query);
  return rows as unknown as Array<Record<string, CsvCell> & { id: number }>;
}

async function* streamStockCsvChunks(
  selectedColumns: StockExportColumn[],
  batchSize: number,
) {
  const headerLine = selectedColumns
    .map((column) => STOCK_EXPORT_COLUMNS[column].header)
    .join(",");

  yield `${headerLine}\n`;

  let lastId = 0;

  while (true) {
    const rows = await getStockRowsChunk(selectedColumns, lastId, batchSize);
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const line = selectedColumns
        .map((column) => {
          const dbColumnName = STOCK_EXPORT_COLUMNS[column].dbColumn;
          return escapeCsvCell(row[dbColumnName]);
        })
        .join(",");

      yield `${line}\n`;
    }

    lastId = Number(rows[rows.length - 1].id);
  }
}

export function parseStockExportColumns(
  columnsFromQuery: string[],
): StockExportColumn[] {
  const allowedColumns = Object.keys(
    STOCK_EXPORT_COLUMNS,
  ) as StockExportColumn[];

  if (columnsFromQuery.length === 0) {
    return allowedColumns;
  }

  const deduplicated = Array.from(new Set(columnsFromQuery));
  const invalidColumns = deduplicated.filter(
    (column) => !allowedColumns.includes(column as StockExportColumn),
  );

  if (invalidColumns.length > 0) {
    throw new AppError(
      `Kolom export tidak valid: ${invalidColumns.join(", ")}`,
      400,
    );
  }

  return deduplicated as StockExportColumn[];
}

export function createStockCsvReadableStream(
  selectedColumns: StockExportColumn[],
  batchSize: number = DEFAULT_BATCH_SIZE,
): ReadableStream<Uint8Array> {
  if (selectedColumns.length === 0) {
    throw new AppError("Pilih minimal satu kolom untuk export", 400);
  }

  const encoder = new TextEncoder();
  const iterator = streamStockCsvChunks(selectedColumns, batchSize);

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const next = await iterator.next();

      if (next.done) {
        controller.close();
        return;
      }

      controller.enqueue(encoder.encode(next.value));
    },
    async cancel() {
      await iterator.return?.();
    },
  });
}
