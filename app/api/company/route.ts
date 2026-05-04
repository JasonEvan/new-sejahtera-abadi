import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { companyService } from "@/modules/company/company.service";
import { companySchema } from "@/modules/company/company.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("company.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const data = await companyService.getSettings();
  return NextResponse.json(data);
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("company.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validatedBody = validate(body, companySchema);

  const data = await companyService.updateSettings(validatedBody);
  return NextResponse.json(data);
});
