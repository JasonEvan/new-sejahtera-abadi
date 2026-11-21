import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { saleService } from "@/modules/sale/sale.service";
import { saleIdValidation } from "@/modules/sale/sale.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();
  if (!session || !session.permissions?.includes("sales.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const clientId = validate(Number(params.get("client_id")), saleIdValidation);
  const salesOrderId = validate(
    Number(params.get("sales_order_id")),
    saleIdValidation,
  );
  const data = await saleService.getSaleEditDetail(clientId, salesOrderId);
  return NextResponse.json({ data });
});
