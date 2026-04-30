import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import {
  createStockCsvReadableStream,
  parseStockExportColumns,
} from "@/modules/system/export.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("download.backup")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const requestedColumns = request.nextUrl.searchParams.getAll("columns");
  const selectedColumns = parseStockExportColumns(requestedColumns);
  const stream = createStockCsvReadableStream(selectedColumns);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stock-export-${timestamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
