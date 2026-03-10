import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { purchasePaymentService } from "@/modules/purchase-payment/purchase-payment.service";
import { backendPurchasePaymentValidation } from "@/modules/purchase-payment/purchase-payment.validation";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendPurchasePaymentValidation);

  await purchasePaymentService.createPurchasePayment(validatedBody);

  return NextResponse.json(
    { message: "Purchase payment created successfully" },
    { status: 201 },
  );
});
