import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { saleService } from "@/modules/sale/sale.service";
import { backendSaleValidation } from "@/modules/sale/sale.validation";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendSaleValidation);

  await saleService.createSale(validatedBody);

  return NextResponse.json(
    { message: "Sale created successfully" },
    { status: 201 },
  );
});
