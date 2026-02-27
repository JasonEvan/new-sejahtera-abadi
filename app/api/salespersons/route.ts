import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { salespersonService } from "@/modules/salesperson/salesperson.service";
import { addSalespersonValidation } from "@/modules/salesperson/salesperson.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const nameOnly = request.nextUrl.searchParams.get("nameOnly") === "true";

  const data = await salespersonService.getSalespersons(nameOnly);
  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, addSalespersonValidation);

  await salespersonService.addSalesperson(validatedBody);
  return NextResponse.json(
    { message: "Berhasil menambahkan salesman" },
    { status: 201 },
  );
});
