import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { reportService } from "@/modules/report/report.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const month = request.nextUrl.searchParams.get("month");
  const year = request.nextUrl.searchParams.get("year");

  if (!month || !year || isNaN(Number(month)) || isNaN(Number(year))) {
    throw new AppError("Invalid month or year parameter", 400);
  }

  const data = await reportService.getProfits(Number(month), Number(year));
  return NextResponse.json({ data });
});
