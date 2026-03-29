import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { salesPaymentService } from "@/modules/sales-payment/sales-payment.service";
import {
  deleteEditReceivablesByInvoiceValidation,
  updateEditReceivablesByInvoiceValidation,
} from "@/modules/sales-payment/sales-payment.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const invoiceNumber = request.nextUrl.searchParams.get("invoice_number");

  if (!invoiceNumber || !invoiceNumber.trim()) {
    throw new AppError("Invalid invoice_number parameter", 400);
  }

  const data = await salesPaymentService.getEditReceivablesByInvoice(
    invoiceNumber.trim().toUpperCase(),
  );

  return NextResponse.json({ data });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(
    body,
    deleteEditReceivablesByInvoiceValidation,
  );

  const result = await salesPaymentService.deleteEditReceivablesByInvoice({
    invoice_number: validatedBody.invoice_number.trim().toUpperCase(),
  });

  return NextResponse.json(result);
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(
    body,
    updateEditReceivablesByInvoiceValidation,
  );

  const result = await salesPaymentService.updateEditReceivablesByInvoice({
    invoice_number: validatedBody.invoice_number.trim().toUpperCase(),
    payments: validatedBody.payments,
  });

  return NextResponse.json(result);
});
