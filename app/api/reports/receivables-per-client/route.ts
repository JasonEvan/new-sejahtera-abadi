import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { reportService } from "@/modules/report/report.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("sales.payment.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const clientId = request.nextUrl.searchParams.get("client_id");

  if (!clientId || isNaN(Number(clientId))) {
    throw new AppError("Invalid client_id parameter", 400);
  }

  const data = await reportService.getReceivablesByClient(Number(clientId));
  return NextResponse.json({ data });
});
