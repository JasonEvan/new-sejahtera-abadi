import { NextRequest, NextResponse } from "next/server";
import { isExpired } from "@/lib/isExpired";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { authRepository } from "@/modules/auth/auth.repository";
import { randomUUID } from "crypto";

export const GET = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
  ) => {
    const { token } = await params;
    const remember = req.nextUrl.searchParams.get("remember") === "true";
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

    // Mark as approved
    await authRepository.updateLoginRequestStatus(request.id, "approved");

    // If owner chose Accept (Remember Device), save to trustedDevices
    if (remember) {
      const existingTrusted = await authRepository.getTrustedDevice(
        request.userId,
        request.deviceFingerprint,
      );

      if (existingTrusted) {
        await authRepository.updateTrustedDeviceLastUsed(existingTrusted.id);
      } else {
        const deviceToken = randomUUID();
        await authRepository.addTrustedDevice({
          userId: request.userId,
          deviceFingerprint: request.deviceFingerprint,
          deviceToken,
          deviceLabel: request.deviceLabel ?? null,
          lastUsedAt: new Date(),
        });
      }
    }

    return NextResponse.redirect(
      `${appUrl}/auth/action-result?status=${remember ? "approved_remember" : "approved"}`,
    );
  },
);
