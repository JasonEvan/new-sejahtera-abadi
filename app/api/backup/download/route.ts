import { getSession } from "@/lib/auth";
import { createSqlDumpReadableStream } from "@/modules/system/backup.service";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("download.backup")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const stream = createSqlDumpReadableStream();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="backup-${timestamp}.sql"`,
      "Cache-Control": "no-store",
    },
  });
});
