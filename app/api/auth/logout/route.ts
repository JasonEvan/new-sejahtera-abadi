import { withErrorHandler } from "@/lib/withErrorHandler";
import { logout } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler(async (request: NextRequest) => {
  await logout();
  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
});
