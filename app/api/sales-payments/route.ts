import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { reportService } from "@/modules/report/report.service";
import { salesPaymentService } from "@/modules/sales-payment/sales-payment.service";
import { backendSalesPaymentValidation } from "@/modules/sales-payment/sales-payment.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await reportService.getAllReceivables();

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendSalesPaymentValidation);

  await salesPaymentService.createSalesPayment(validatedBody);

  return NextResponse.json(
    { message: "Sales payment created successfully" },
    { status: 201 },
  );
});
