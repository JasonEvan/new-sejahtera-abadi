import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { purchaseService } from "@/modules/purchase/purchase.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const clientId = Number(request.nextUrl.searchParams.get("client_id"));
  const namePrefix = request.nextUrl.searchParams.get("name_prefix") || "";

  if (isNaN(clientId)) {
    throw new AppError("Client ID is required in a valid format", 400);
  }

  const data = await purchaseService.getLatestPurchasedItemsByClient(
    clientId,
    namePrefix,
  );

  return NextResponse.json({ data });
});
