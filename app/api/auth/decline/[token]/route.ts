import { NextRequest, NextResponse } from "next/server";
import { withNoStore } from "@/modules/auth/login-receipt";
import { authRepository } from "@/modules/auth/auth.repository";

export const GET = withNoStore(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
  ) => {
    const { token } = await params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const status = await authRepository.decideLoginRequest(token, "declined");

    return NextResponse.redirect(
      `${appUrl}/auth/action-result?status=${status}`,
    );
  },
);
