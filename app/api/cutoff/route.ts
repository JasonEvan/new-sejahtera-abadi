import { NextRequest, NextResponse } from "next/server";
import { systemService } from "@/modules/system/system.service";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { AppError } from "@/lib/errors";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { startDate, endDate } = await request.json();

  if (!startDate || !endDate) {
    throw new AppError("Start date and end date are required", 400);
  }

  await systemService.performYearlyCutoff(
    new Date(startDate),
    new Date(endDate),
  );

  return NextResponse.json({
    message: "Cut-off process completed successfully",
  });
});
