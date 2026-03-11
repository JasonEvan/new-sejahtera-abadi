import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { reportService } from "@/modules/report/report.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const clientId = request.nextUrl.searchParams.get("client_id");

  if (!clientId || isNaN(Number(clientId))) {
    throw new AppError("Invalid client_id parameter", 400);
  }

  const data = await reportService.getPayablesByClient(Number(clientId));
  return NextResponse.json({ data });
});
