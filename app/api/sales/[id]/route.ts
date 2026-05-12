import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { saleService } from "@/modules/sale/sale.service";
import { backendEditSaleValidation } from "@/modules/sale/sale.validation";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const session = await getSession();

    if (!session || !session.permissions?.includes("sales.update")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const salesOrderId = Number((await params).id);
    if (isNaN(salesOrderId)) {
      throw new AppError("Invalid sales order ID", 400);
    }

    const body = await request.json();
    const validatedBody = validate(body, backendEditSaleValidation);

    await saleService.updateSale(salesOrderId, validatedBody);

    return NextResponse.json(
      { message: "Sale updated successfully" },
      { status: 200 },
    );
  },
);

export const DELETE = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const session = await getSession();

    if (!session || !session.permissions?.includes("sales.delete")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const salesOrderId = Number((await params).id);
    if (isNaN(salesOrderId)) {
      throw new AppError("Invalid sales order ID", 400);
    }

    await saleService.deleteSale(salesOrderId);

    return NextResponse.json(
      { message: "Sale deleted successfully" },
      { status: 200 },
    );
  },
);
