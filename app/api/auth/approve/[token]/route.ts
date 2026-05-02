import { NextRequest, NextResponse } from "next/server";
import { isExpired } from "@/lib/isExpired";
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

    // Not found or already actioned
    if (!request) {
      return NextResponse.redirect(
        `${appUrl}/auth/action-result?status=invalid_token`,
      );
    }

    // Lazy expiry check
    if (isExpired(request.expiresAt)) {
      await authRepository.updateLoginRequestStatus(request.id, "expired");
      return NextResponse.redirect(
        `${appUrl}/auth/action-result?status=expired`,
      );
    }

    // Mark as approved (single-use — status no longer 'pending' after this)
    await authRepository.updateLoginRequestStatus(request.id, "approved");

    return NextResponse.redirect(
      `${appUrl}/auth/action-result?status=approved`,
    );
  },
);
