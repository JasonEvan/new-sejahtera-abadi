import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { purchasePaymentService } from "@/modules/purchase-payment/purchase-payment.service";
import {
  deleteEditPayablesByInvoiceValidation,
  updateEditPayablesByInvoiceValidation,
} from "@/modules/purchase-payment/purchase-payment.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const invoiceNumber = request.nextUrl.searchParams.get("invoice_number");

  if (!invoiceNumber || !invoiceNumber.trim()) {
    throw new AppError("Invalid invoice_number parameter", 400);
  }

  const data = await purchasePaymentService.getEditPayablesByInvoice(
    invoiceNumber.trim().toUpperCase(),
  );

  return NextResponse.json({ data });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("purchase.payment.delete")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, deleteEditPayablesByInvoiceValidation);

  const result = await purchasePaymentService.deleteEditPayablesByInvoice({
    invoice_number: validatedBody.invoice_number.trim().toUpperCase(),
  });

  return NextResponse.json(result);
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("purchase.payment.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, updateEditPayablesByInvoiceValidation);

  const result = await purchasePaymentService.updateEditPayablesByInvoice({
    invoice_number: validatedBody.invoice_number.trim().toUpperCase(),
    payments: validatedBody.payments,
  });

  return NextResponse.json(result);
});
