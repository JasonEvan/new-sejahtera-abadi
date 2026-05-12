import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { reportService } from "@/modules/report/report.service";
import { salesPaymentService } from "@/modules/sales-payment/sales-payment.service";
import { salesPaymentRepository } from "@/modules/sales-payment/sales-payment.repository";
import { backendSalesPaymentValidation } from "@/modules/sales-payment/sales-payment.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  const clientId = request.nextUrl.searchParams.get("client_id");
  const transactionNumber =
    request.nextUrl.searchParams.get("transaction_number");

  if (clientId) {
    if (!session || !session.permissions?.includes("sales.payment.view")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const data = await salesPaymentService.getTransactionsByClientId(
      Number(clientId),
    );
    return NextResponse.json({ data });
  }

  if (transactionNumber) {
    if (!session || !session.permissions?.includes("sales.payment.view")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const data =
      await salesPaymentService.getTransactionSummary(transactionNumber);
    return NextResponse.json({ data });
  }

  if (!session || !session.permissions?.includes("sales.payment.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const data = await reportService.getAllReceivables();

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("sales.payment.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, backendSalesPaymentValidation);

  await salesPaymentService.createSalesPayment(validatedBody);

  return NextResponse.json(
    { message: "Sales payment created successfully" },
    { status: 201 },
  );
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("sales.payment.delete")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const transactionId = request.nextUrl.searchParams.get("transaction_id");

  if (!transactionId) {
    throw new AppError("Transaction ID is required", 400);
  }

  const payment = await salesPaymentRepository.getById(Number(transactionId));
  if (!payment) {
    throw new AppError("Payment transaction not found", 404);
  }

  const result = await salesPaymentService.deletePaymentTransaction(
    payment.transaction_number,
  );

  return NextResponse.json(result);
});
