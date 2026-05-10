import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { reportService } from "@/modules/report/report.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("asset-value.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const data = await reportService.getAssetValues();
  return NextResponse.json({ data });
});
