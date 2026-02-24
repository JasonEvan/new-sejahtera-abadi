import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { clientService } from "@/modules/client/client.service";
import { addClientValidation } from "@/modules/client/client.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await clientService.getClients();
  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, addClientValidation);

  await clientService.addClient(validatedBody);
  return NextResponse.json(
    { message: "Client berhasil ditambahkan" },
    { status: 201 },
  );
});
