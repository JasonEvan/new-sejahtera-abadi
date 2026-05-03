import { NextRequest, NextResponse } from "next/server";
import { systemService } from "@/modules/system/system.service";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { AppError } from "@/lib/errors";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { endDate } = await request.json();

  if (!endDate) {
    throw new AppError("End date is required", 400);
  }

  await systemService.performYearlyCutoff(
    new Date(endDate),
  );

  return NextResponse.json({
    message: "Cut-off process completed successfully",
  });
});
