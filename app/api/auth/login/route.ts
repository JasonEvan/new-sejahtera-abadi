import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import bcrypt from "bcrypt";
import { userRepository } from "@/modules/user/user.repository";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 },
    );
  }

  // 1. Find user
  const user = await userRepository.getUserByEmail(email);

  if (!user) {
    return NextResponse.json(
      { message: "Invalid email or password" },
      { status: 401 },
    );
  }

  // 2. Check password
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    return NextResponse.json(
      { message: "Invalid email or password" },
      { status: 401 },
    );
  }

  // 3. Create session and set cookie
  // The login function in lib/auth.ts handles the cookie configuration:
  // httpOnly: true, secure: prod, maxAge: 3h, path: "/", sameSite: "lax"
  await login({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({
    success: true,
    message: "Logged in successfully",
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});
