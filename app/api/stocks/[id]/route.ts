import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { stockService } from "@/modules/stock/stock.service";
import { addStockValidation } from "@/modules/stock/stock.validation";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const stockId = (await params).id;
    if (isNaN(Number(stockId))) {
      throw new AppError("ID stock tidak valid", 400);
    }

    const body = await request.json();
    const validatedBody = validate(body, addStockValidation);

    await stockService.updateStock(Number(stockId), validatedBody);
    return NextResponse.json({ message: "Stock berhasil diperbarui" });
  },
);

export const DELETE = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const stockId = (await params).id;
    if (isNaN(Number(stockId))) {
      throw new AppError("ID stock tidak valid", 400);
    }

    await stockService.deleteStock(Number(stockId));
    return NextResponse.json({ message: "Stock berhasil dihapus" });
  },
);
