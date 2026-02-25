import { withErrorHandler } from "@/lib/withErrorHandler";
import { stockService } from "@/modules/stock/stock.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await stockService.getAllStocks();

  return NextResponse.json({ data });
});
