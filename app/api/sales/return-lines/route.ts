import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { saleService } from "@/modules/sale/sale.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const invoiceNumber = request.nextUrl.searchParams.get("invoice_number");

  if (!invoiceNumber) {
    throw new AppError("Invoice number is required", 400);
  }

  const data = await saleService.getSaleReturnLines(invoiceNumber);
  return NextResponse.json({ data });
});
