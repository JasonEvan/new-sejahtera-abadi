import { getSession } from "@/lib/auth";
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
  const session = await getSession();

  if (!session || !session.permissions?.includes("sales.return.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const forMenu = request.nextUrl.searchParams.get("for_menu") === "true";

  if (forMenu) {
    const data = await salesReturnService.getUnpaidReturnedInvoices();
    return NextResponse.json({ data });
  }

  const returnId = request.nextUrl.searchParams.get("return_id");
  if (returnId) {
    const data = await salesReturnService.getEditSaleReturnDetail(Number(returnId));
    return NextResponse.json({ data });
  }

  const salesOrderId = request.nextUrl.searchParams.get("sales_order_id");
  if (salesOrderId) {
    const data = await salesReturnService.getReturnHistory(Number(salesOrderId));
    return NextResponse.json({ data });
  }

  throw new AppError("Missing query parameter", 400);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("sales.return.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, backendSaleReturnValidation);

  await salesReturnService.createSalesReturn(validatedBody);

  return NextResponse.json(
    { message: "Sale return created successfully" },
    { status: 201 },
  );
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("sales.return.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, backendEditSaleReturnValidation);

  const result = await salesReturnService.updateSaleReturn({
    sales_return_id: validatedBody.sales_return_id,
    return_date: validatedBody.return_date,
    lines: validatedBody.lines,
  });

  return NextResponse.json(result);
});
