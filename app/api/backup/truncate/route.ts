import { withErrorHandler } from "@/lib/withErrorHandler";
import { truncateAllTables } from "@/modules/system/backup.service";
import { NextResponse } from "next/server";

export const DELETE = withErrorHandler(async () => {
  await truncateAllTables();
  return NextResponse.json({ message: "Semua data berhasil dihapus" });
});
