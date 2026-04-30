import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { restoreFromSqlDump } from "@/modules/system/backup.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("download.backup")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new AppError("File .sql wajib diupload", 400);
  }

  if (!file.name.toLowerCase().endsWith(".sql")) {
    throw new AppError("File harus berformat .sql", 400);
  }

  const sqlContent = await file.text();
  await restoreFromSqlDump(sqlContent);

  return NextResponse.json({ message: "Restore data berhasil" });
});
