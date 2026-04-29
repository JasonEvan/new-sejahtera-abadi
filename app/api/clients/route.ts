import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { clientService } from "@/modules/client/client.service";
import { addClientValidation } from "@/modules/client/client.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const nameOnly = request.nextUrl.searchParams.get("nameOnly") === "true";

  const data = await clientService.getClients(nameOnly);
  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("client.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, addClientValidation);

  await clientService.addClient(validatedBody);
  return NextResponse.json(
    { message: "Client berhasil ditambahkan" },
    { status: 201 },
  );
});
