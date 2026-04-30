import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { reportService } from "@/modules/report/report.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("inventory-ledger.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const stockId = request.nextUrl.searchParams.get("stock_id");

  if (!stockId || isNaN(Number(stockId))) {
    throw new AppError("Invalid stock_id parameter", 400);
  }

  const data = await reportService.getInventoryLedgers(Number(stockId));
  return NextResponse.json({ data });
});
