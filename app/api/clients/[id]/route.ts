import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { clientService } from "@/modules/client/client.service";
import { addClientValidation } from "@/modules/client/client.validation";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const clientId = (await params).id;
    if (isNaN(Number(clientId))) {
      throw new AppError("Invalid client ID", 400);
    }

    const body = await request.json();
    const validatedBody = validate(body, addClientValidation);

    await clientService.updateClient(Number(clientId), validatedBody);

    return NextResponse.json(
      { message: "Client berhasil diupdate" },
      { status: 200 },
    );
  },
);

export const DELETE = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const clientId = (await params).id;
    if (isNaN(Number(clientId))) {
      throw new AppError("Invalid client ID", 400);
    }

    await clientService.deleteClient(Number(clientId));

    return NextResponse.json(
      { message: "Client berhasil dihapus" },
      { status: 200 },
    );
  },
);
