import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { userService } from "@/modules/user/user.service";
import { userSchema } from "@/modules/user/user.validation";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await userService.getUsers();
  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, userSchema);

  await userService.addUser(validatedBody as any);
  return NextResponse.json(
    { message: "User berhasil ditambahkan" },
    { status: 201 },
  );
});
