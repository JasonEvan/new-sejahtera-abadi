import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { saleService } from "@/modules/sale/sale.service";
import { backendSaleValidation } from "@/modules/sale/sale.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();
  const invoicePrefix = request.nextUrl.searchParams.get("invoice_prefix");

  if (invoicePrefix !== null) {
    if (!session || !session.permissions?.includes("sales.view")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const data = await saleService.getSalesInvoices(invoicePrefix);
    return NextResponse.json({ data });
  }

  const invoiceNumberToCheck =
    request.nextUrl.searchParams.get("check_existence");
  if (invoiceNumberToCheck) {
    const exists =
      await saleService.checkInvoiceExistence(invoiceNumberToCheck);
    return NextResponse.json({ data: { exists } });
  }

  const clientId = request.nextUrl.searchParams.get("client_id");
  const isPaidOff = request.nextUrl.searchParams.get("is_paid_off") === "true";
  const forMenu = request.nextUrl.searchParams.get("for_menu") === "true";
  const forReturn = request.nextUrl.searchParams.get("for_return") === "true";

  if (forMenu) {
    if (!session || !session.permissions?.includes("sales.view")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  if (forReturn) {
    if (!session || !session.permissions?.includes("sales.return.view")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  if (!clientId || isNaN(Number(clientId))) {
    throw new AppError("Client ID is required in a valid format", 400);
  }

  let data;
  if (forMenu) {
    data = await saleService.getOrdersMenu(Number(clientId), isPaidOff);
  } else if (forReturn) {
    data = await saleService.getReturnEligibleOrders(Number(clientId));
  }

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("sales.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, backendSaleValidation);

  await saleService.createSale(validatedBody);

  return NextResponse.json(
    { message: "Sale created successfully" },
    { status: 201 },
  );
});
