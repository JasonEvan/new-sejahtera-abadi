import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { purchaseService } from "@/modules/purchase/purchase.service";
import { backendPurchaseValidation } from "@/modules/purchase/purchase.validation";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendPurchaseValidation);

  await purchaseService.createPurchase(validatedBody);

  return NextResponse.json(
    { message: "Purchase created successfully" },
    { status: 201 },
  );
});
