import { withErrorHandler } from "@/lib/withErrorHandler";
import { logout } from "@/lib/auth";
import { NextResponse } from "next/server";

export const POST = withErrorHandler(async () => {
  await logout();
  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
});
