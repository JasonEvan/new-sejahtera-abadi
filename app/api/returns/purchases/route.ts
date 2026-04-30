import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { AppError } from "@/lib/errors";
import { purchaseReturnService } from "@/modules/purchase-return/purchase-return.service";
import {
  backendEditPurchaseReturnValidation,
  backendPurchaseReturnValidation,
} from "@/modules/purchase-return/purchase-return.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const forMenu = request.nextUrl.searchParams.get("for_menu") === "true";
  const invoiceNumber = request.nextUrl.searchParams.get("invoice_number");

  if (forMenu) {
    const data = await purchaseReturnService.getUnpaidReturnedInvoices();
    return NextResponse.json({ data });
  }

  if (invoiceNumber) {
    const data =
      await purchaseReturnService.getEditPurchaseReturnDetail(invoiceNumber);
    return NextResponse.json({ data });
  }

  throw new AppError("Missing query parameter", 400);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendPurchaseReturnValidation);

  await purchaseReturnService.createPurchaseReturn(validatedBody);

  return NextResponse.json(
    { message: "Purchase return created successfully" },
    { status: 201 },
  );
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("purchase.return.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, backendEditPurchaseReturnValidation);

  const result = await purchaseReturnService.updatePurchaseReturn({
    invoice_number: validatedBody.invoice_number.trim().toUpperCase(),
    return_date: validatedBody.return_date,
    lines: validatedBody.lines,
  });

  return NextResponse.json(result);
});
