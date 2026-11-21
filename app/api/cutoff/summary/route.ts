import { NextRequest, NextResponse } from "next/server";
import { systemService } from "@/modules/system/system.service";
import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { AppError } from "@/lib/errors";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("system.cutoff")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const endDate = searchParams.get("endDate");

  if (!endDate) {
    throw new AppError("End date is required", 400);
  }

  const summary = await systemService.getUnpaidOrdersSummary(new Date(endDate));

  return NextResponse.json(summary);
});
