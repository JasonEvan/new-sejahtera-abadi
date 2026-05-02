import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { authRepository } from "@/modules/auth/auth.repository";

export const GET = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
  ) => {
    const { token } = await params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const request = await authRepository.getLoginRequestByToken(token);
    if (!request) {
      return NextResponse.redirect(
        `${appUrl}/auth/action-result?status=invalid_token`,
      );
    }

    // Only update if still pending (idempotent — safe to call multiple times)
    await authRepository.updateLoginRequestStatusByToken(token, "declined");

    return NextResponse.redirect(
      `${appUrl}/auth/action-result?status=declined`,
    );
  },
);
