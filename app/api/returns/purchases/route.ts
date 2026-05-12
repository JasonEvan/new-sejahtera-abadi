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
  const session = await getSession();

  if (!session || !session.permissions?.includes("purchase.return.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const forMenu = request.nextUrl.searchParams.get("for_menu") === "true";

  if (forMenu) {
    const data = await purchaseReturnService.getUnpaidReturnedInvoices();
    return NextResponse.json({ data });
  }

  const returnId = request.nextUrl.searchParams.get("return_id");
  if (returnId) {
    const data = await purchaseReturnService.getEditPurchaseReturnDetail(
      Number(returnId),
    );
    return NextResponse.json({ data });
  }

  const purchaseOrderId = request.nextUrl.searchParams.get("purchase_order_id");
  if (purchaseOrderId) {
    const data = await purchaseReturnService.getReturnHistory(
      Number(purchaseOrderId),
    );
    return NextResponse.json({ data });
  }

  throw new AppError("Missing query parameter", 400);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("purchase.return.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

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
    purchase_return_id: validatedBody.purchase_return_id,
    return_date: validatedBody.return_date,
    lines: validatedBody.lines,
  });

  return NextResponse.json(result);
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("purchase.return.delete")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const returnId = request.nextUrl.searchParams.get("return_id");

  if (!returnId) {
    throw new AppError("Return ID is required", 400);
  }

  const result = await purchaseReturnService.deletePurchaseReturn(
    Number(returnId),
  );

  return NextResponse.json(result);
});
