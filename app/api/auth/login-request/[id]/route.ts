import { NextRequest, NextResponse } from "next/server";
import { isExpired } from "@/lib/isExpired";
import { encrypt } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { authRepository } from "@/modules/auth/auth.repository";
import { userRepository } from "@/modules/user/user.repository";
import { AppError } from "@/lib/errors";

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const request = await authRepository.getLoginRequestById(Number(id));

    if (!request) {
      throw new AppError("Not found", 404);
    }

    // Lazy expiry — check on every read
    if (request.status === "pending" && isExpired(request.expiresAt)) {
      await authRepository.updateLoginRequestStatus(request.id, "expired");
      return NextResponse.json({ status: "expired" });
    }

    if (request.status === "declined" || request.status === "expired") {
      return NextResponse.json({ status: request.status });
    }

    if (request.status === "pending") {
      return NextResponse.json({ status: "pending" });
    }

    // status === 'approved' — issue session via cookie
    const user = await userRepository.getUserById(request.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const session = await encrypt({
      id: user.id,
      email: user.email,
      role: user.role ?? "unknown",
      permissions: user.permissions,
    });

    const response = NextResponse.json({ status: "approved" });
    response.cookies.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 3, // 3 hours
      path: "/",
    });

    // If owner opted to remember this device, set device_token cookie for client
    const trusted = await authRepository.getTrustedDevice(
      user.id,
      request.deviceFingerprint,
    );
    if (trusted) {
      response.cookies.set("device_token", trusted.deviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });
    }

    return response;
  },
);
