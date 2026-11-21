import { NextRequest, NextResponse } from "next/server";
import { withNoStore } from "@/modules/auth/login-receipt";
import { authRepository } from "@/modules/auth/auth.repository";

export const GET = withNoStore(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
  ) => {
    const { token } = await params;
    const remember = req.nextUrl.searchParams.get("remember") === "true";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const status = await authRepository.decideLoginRequest(
      token,
      "approved",
      remember,
    );

    return NextResponse.redirect(
      `${appUrl}/auth/action-result?status=${status}`,
    );
  },
);
