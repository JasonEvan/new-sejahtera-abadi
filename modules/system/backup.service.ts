import { sql as drizzleSql } from "drizzle-orm";
import db from "@/lib/drizzle";

type SqlCell = string | number | boolean | Date | null;

const TABLES_IN_INSERT_ORDER = [
  "users",
  "clients",
  "stocks",
  "salespersons",
  "purchase_orders",
  "sales_orders",
  "purchase_order_lines",
  "sales_order_lines",
  "purchase_payments",
  "sales_payments",
  "purchase_returns",
  "sales_returns",
  "purchase_return_lines",
  "sales_return_lines",
] as const;

const TABLES_WITH_SERIAL_ID = TABLES_IN_INSERT_ORDER;

const DEFAULT_BATCH_SIZE = 500;

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function escapeString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function toSqlLiteral(value: SqlCell): string {
  if (value === null) return "NULL";
  if (typeof value === "string") return escapeString(value);
  if (value instanceof Date) return escapeString(value.toISOString());
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

function makeInsert(table: string, rows: Record<string, SqlCell>[]): string {
  if (rows.length === 0) return "";

  const keys = Object.keys(rows[0]);
  const cols = keys.map(quoteIdentifier).join(", ");

  const values = rows
    .map((row) => {
      const vals = keys.map((key) => toSqlLiteral(row[key]));
      return `(${vals.join(", ")})`;
    })
    .join(",\n");

  return `INSERT INTO ${quoteIdentifier(table)} (${cols}) VALUES\n${values};\n\n`;
}

function makeSetval(table: string, idColumn: string = "id"): string {
  const quotedTable = quoteIdentifier(table);
  const quotedColumn = quoteIdentifier(idColumn);
  return `SELECT setval(pg_get_serial_sequence('${quotedTable}', '${idColumn}'), COALESCE((SELECT MAX(${quotedColumn}) FROM ${quotedTable}), 0) + 1, false);\n`;
}

async function getRowsForTable(
  table: string,
  offset: number,
  limit: number,
): Promise<Record<string, SqlCell>[]> {
  const tableName = quoteIdentifier(table);
  const query = drizzleSql.raw(
    `SELECT * FROM ${tableName} ORDER BY id ASC OFFSET ${offset} LIMIT ${limit}`,
  );

  const result = await db.execute(query);
  return result as unknown as Record<string, SqlCell>[];
}

async function* streamDumpChunks(batchSize: number = DEFAULT_BATCH_SIZE) {
  yield "-- Sejahtera Abadi SQL Backup\n";
  yield `-- Generated at ${new Date().toISOString()}\n\n`;
  yield "BEGIN;\n\n";

  for (const table of TABLES_IN_INSERT_ORDER) {
    yield `-- Table: ${table}\n`;

    let offset = 0;
    while (true) {
      const rows = await getRowsForTable(table, offset, batchSize);
      if (rows.length === 0) break;

      yield makeInsert(table, rows);
      offset += batchSize;
    }

    yield "\n";
  }

  yield "-- Reset serial sequences\n";
  for (const table of TABLES_WITH_SERIAL_ID) {
    yield makeSetval(table);
  }

  yield "\nCOMMIT;\n";
}

function splitSqlStatements(sqlContent: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;

  for (let i = 0; i < sqlContent.length; i += 1) {
    const char = sqlContent[i];
    const next = sqlContent[i + 1];

    current += char;

    if (char === "'" && inSingleQuote && next === "'") {
      current += next;
      i += 1;
      continue;
    }

    if (char === "'") {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === ";" && !inSingleQuote) {
      const statement = current.trim();
      if (statement) {
        statements.push(statement);
      }
      current = "";
    }
  }

  const trailing = current.trim();
  if (trailing) {
    statements.push(trailing);
  }

  return statements;
}

export async function truncateAllTables(): Promise<void> {
  const tableNames = TABLES_IN_INSERT_ORDER.map(quoteIdentifier).join(", ");
  const query = drizzleSql.raw(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
  );
  await db.execute(query);
}

export async function restoreFromSqlDump(sqlContent: string): Promise<void> {
  const trimmedContent = sqlContent.trim();
  if (!trimmedContent) {
    return;
  }

  const statements = splitSqlStatements(trimmedContent);

  await db.transaction(async (tx) => {
    // Execute TRUNCATE inside the transaction for atomicity
    const tableNames = TABLES_IN_INSERT_ORDER.map(quoteIdentifier).join(", ");
    const truncateQuery = drizzleSql.raw(
      `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
    );
    await tx.execute(truncateQuery);

    for (const statement of statements) {
      const normalizedStatement = statement.replace(/;$/, "").trim();
      if (!normalizedStatement) {
        continue;
      }

      // Clean comments before checking for transaction commands
      const commandOnly = normalizedStatement.replace(/^--.*$/gm, "").trim();
      if (!commandOnly) {
        continue;
      }

      // Skip transaction control statements
      if (/^(BEGIN|COMMIT|ROLLBACK|START\s+TRANSACTION)$/i.test(commandOnly)) {
        continue;
      }

      await tx.execute(drizzleSql.raw(normalizedStatement));
    }
  });
}

export function createSqlDumpReadableStream(): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = streamDumpChunks();

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
