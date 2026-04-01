import { withErrorHandler } from "@/lib/withErrorHandler";
import { reportService } from "@/modules/report/report.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await reportService.getDashboardSnapshot();
  return NextResponse.json({ data });
});
