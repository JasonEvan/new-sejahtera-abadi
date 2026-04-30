import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { purchasePaymentService } from "@/modules/purchase-payment/purchase-payment.service";
import { backendPurchasePaymentValidation } from "@/modules/purchase-payment/purchase-payment.validation";
import { reportService } from "@/modules/report/report.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("purchase.payment.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const data = await reportService.getAllPayables();

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("purchase.payment.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, backendPurchasePaymentValidation);

  await purchasePaymentService.createPurchasePayment(validatedBody);

  return NextResponse.json(
    { message: "Purchase payment created successfully" },
    { status: 201 },
  );
});
