import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { stockService } from "@/modules/stock/stock.service";
import { addStockValidation } from "@/modules/stock/stock.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await stockService.getAllStocks();

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, addStockValidation);

  await stockService.addStock(validatedBody);

  return NextResponse.json(
    { message: "Stock berhasil ditambahkan" },
    { status: 201 },
  );
});
