import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { saleService } from "@/modules/sale/sale.service";
import { backendSaleValidation } from "@/modules/sale/sale.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const clientId = request.nextUrl.searchParams.get("client_id");
  const isPaidOff = request.nextUrl.searchParams.get("is_paid_off") === "true";
  const forMenu = request.nextUrl.searchParams.get("for_menu") === "true";

  if (!clientId || isNaN(Number(clientId))) {
    throw new AppError("Client ID is required in a valid format", 400);
  }

  let data;
  if (forMenu) {
    data = await saleService.getOrdersMenu(Number(clientId), isPaidOff);
  }

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendSaleValidation);

  await saleService.createSale(validatedBody);

  return NextResponse.json(
    { message: "Sale created successfully" },
    { status: 201 },
  );
});
