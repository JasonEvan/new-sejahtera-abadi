import { withErrorHandler } from "@/lib/withErrorHandler";
import { clientService } from "@/modules/client/client.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await clientService.getClients();
  return NextResponse.json({ data });
});
