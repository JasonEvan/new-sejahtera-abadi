import { AppError } from "@/lib/errors";
import db from "@/lib/drizzle";
import {
  createStockCsvReadableStream,
  parseStockExportColumns,
  STOCK_EXPORT_COLUMNS,
} from "./export.service";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    execute: jest.fn(),
  },
}));

jest.mock("drizzle-orm", () => ({
  sql: {
    raw: jest.fn((text: string) => ({ text })),
  },
}));

const mockedDb = db as unknown as {
  execute: jest.Mock;
};

async function readStream(stream: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let result = "";

  while (true) {
    const next = await reader.read();
    if (next.done) break;
    result += decoder.decode(next.value, { stream: true });
  }

  result += decoder.decode();
  return result;
}

describe("export.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parseStockExportColumns returns all allowed columns when query is empty", () => {
    const result = parseStockExportColumns([]);

    expect(result).toEqual(Object.keys(STOCK_EXPORT_COLUMNS));
  });

  it("parseStockExportColumns deduplicates selected columns", () => {
    const result = parseStockExportColumns(["name", "unit", "name"]);

    expect(result).toEqual(["name", "unit"]);
  });

  it("parseStockExportColumns throws AppError for invalid columns", () => {
    expect(() => parseStockExportColumns(["name", "invalid_col"])).toThrow(
      expect.objectContaining({
        message: "Kolom export tidak valid: invalid_col",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("createStockCsvReadableStream throws when selectedColumns is empty", () => {
    expect(() => createStockCsvReadableStream([])).toThrow(
      expect.objectContaining({
        message: "Pilih minimal satu kolom untuk export",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("createStockCsvReadableStream streams header and escaped row values", async () => {
    mockedDb.execute
      .mockResolvedValueOnce([
        { id: 1, name: "A, B", unit: "pcs" },
        { id: 2, name: 'He said "Hi"', unit: "box" },
      ])
      .mockResolvedValueOnce([]);

    const stream = createStockCsvReadableStream(["name", "unit"], 2);
    const csv = await readStream(stream);

    expect(csv).toContain("nama,satuan\n");
    expect(csv).toContain('"A, B",pcs\n');
    expect(csv).toContain('"He said ""Hi""",box\n');
    expect(mockedDb.execute).toHaveBeenCalledTimes(2);
  });
});
