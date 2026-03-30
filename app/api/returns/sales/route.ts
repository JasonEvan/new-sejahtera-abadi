import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { AppError } from "@/lib/errors";
import { salesReturnService } from "@/modules/sales-return/sales-return.service";
import {
  backendEditSaleReturnValidation,
  backendSaleReturnValidation,
} from "@/modules/sales-return/sales-return.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const forMenu = request.nextUrl.searchParams.get("for_menu") === "true";
  const invoiceNumber = request.nextUrl.searchParams.get("invoice_number");

  if (forMenu) {
    const data = await salesReturnService.getUnpaidReturnedInvoices();
    return NextResponse.json({ data });
  }

  if (invoiceNumber) {
    const data =
      await salesReturnService.getEditSaleReturnDetail(invoiceNumber);
    return NextResponse.json({ data });
  }

  throw new AppError("Missing query parameter", 400);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendSaleReturnValidation);

  await salesReturnService.createSalesReturn(validatedBody);

  return NextResponse.json(
    { message: "Sale return created successfully" },
    { status: 201 },
  );
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendEditSaleReturnValidation);

  const result = await salesReturnService.updateSaleReturn({
    invoice_number: validatedBody.invoice_number.trim().toUpperCase(),
    return_date: validatedBody.return_date,
    lines: validatedBody.lines,
  });

  return NextResponse.json(result);
});
