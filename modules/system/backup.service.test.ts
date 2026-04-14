import db from "@/lib/drizzle";
import {
  createSqlDumpReadableStream,
  restoreFromSqlDump,
  truncateAllTables,
} from "./backup.service";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    execute: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock("drizzle-orm", () => ({
  sql: {
    raw: jest.fn((text: string) => ({ text })),
  },
}));

const mockedDb = db as unknown as {
  execute: jest.Mock;
  transaction: jest.Mock;
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

describe("backup.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("truncateAllTables issues TRUNCATE RESTART IDENTITY CASCADE", async () => {
    mockedDb.execute.mockResolvedValueOnce([]);

    await truncateAllTables();

    expect(mockedDb.execute).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(mockedDb.execute.mock.calls[0][0])).toContain(
      "TRUNCATE TABLE",
    );
    expect(JSON.stringify(mockedDb.execute.mock.calls[0][0])).toContain(
      "RESTART IDENTITY CASCADE",
    );
  });

  it("restoreFromSqlDump returns early for empty sql", async () => {
    await restoreFromSqlDump("  \n  ");

    expect(mockedDb.transaction).not.toHaveBeenCalled();
  });

  it("restoreFromSqlDump truncates tables and executes non-transaction statements", async () => {
    const tx = { execute: jest.fn().mockResolvedValue({}) };
    mockedDb.transaction.mockImplementation(
      async (cb: (t: unknown) => unknown) => cb(tx),
    );

    const sqlContent = `
      BEGIN;
      -- should be ignored
      INSERT INTO clients (id, name) VALUES (1, 'A');
      COMMIT;
      UPDATE stocks SET name = 'X''Y' WHERE id = 1;
    `;

    await restoreFromSqlDump(sqlContent);

    expect(mockedDb.transaction).toHaveBeenCalledTimes(1);
    expect(tx.execute).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(tx.execute.mock.calls[0][0])).toContain(
      "TRUNCATE TABLE",
    );
    expect(JSON.stringify(tx.execute.mock.calls[1][0])).toContain(
      "INSERT INTO clients",
    );
    expect(JSON.stringify(tx.execute.mock.calls[2][0])).toContain(
      "UPDATE stocks",
    );
  });

  it("createSqlDumpReadableStream emits backup prelude and closing statements", async () => {
    mockedDb.execute.mockResolvedValue([]);

    const stream = createSqlDumpReadableStream();
    const text = await readStream(stream);

    expect(text).toContain("-- Sejahtera Abadi SQL Backup");
    expect(text).toContain("BEGIN;");
    expect(text).toContain("-- Table: users");
    expect(text).toContain("Reset serial sequences");
    expect(text).toContain("COMMIT;");
    expect(mockedDb.execute).toHaveBeenCalled();
  });
});
