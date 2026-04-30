import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { truncateAllTables } from "@/modules/system/backup.service";
import { NextResponse } from "next/server";

export const DELETE = withErrorHandler(async () => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("download.backup")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await truncateAllTables();
  return NextResponse.json({ message: "Semua data berhasil dihapus" });
});
