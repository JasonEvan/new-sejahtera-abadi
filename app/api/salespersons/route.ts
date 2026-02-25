import { withErrorHandler } from "@/lib/withErrorHandler";
import { salespersonService } from "@/modules/salesperson/salesperson.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await salespersonService.getSalespersons();
  return NextResponse.json({ data });
});
