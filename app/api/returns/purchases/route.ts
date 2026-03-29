import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { purchaseReturnService } from "@/modules/purchase-return/purchase-return.service";
import { backendPurchaseReturnValidation } from "@/modules/purchase-return/purchase-return.validation";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendPurchaseReturnValidation);

  await purchaseReturnService.createPurchaseReturn(validatedBody);

  return NextResponse.json(
    { message: "Purchase return created successfully" },
    { status: 201 },
  );
});
