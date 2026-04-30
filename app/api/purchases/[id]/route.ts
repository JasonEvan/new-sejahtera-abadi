import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { purchaseService } from "@/modules/purchase/purchase.service";
import { backendEditPurchaseValidation } from "@/modules/purchase/purchase.validation";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const session = await getSession();

    if (!session || !session.permissions?.includes("purchase.update")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const purchaseOrderId = Number((await params).id);
    if (isNaN(purchaseOrderId)) {
      throw new AppError("Invalid purchase order ID", 400);
    }

    const body = await request.json();
    const validatedBody = validate(body, backendEditPurchaseValidation);

    await purchaseService.updatePurchase(purchaseOrderId, validatedBody);

    return NextResponse.json(
      { message: "Purchase updated successfully" },
      { status: 200 },
    );
  },
);
