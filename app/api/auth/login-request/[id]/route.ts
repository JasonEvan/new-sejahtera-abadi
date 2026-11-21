import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/auth";
import {
  approvedDeviceId,
  authRepository,
} from "@/modules/auth/auth.repository";
import { readLoginReceipt, withNoStore } from "@/modules/auth/login-receipt";
import { userRepository } from "@/modules/user/user.repository";

function unavailable() {
  return NextResponse.json({ status: "unavailable" }, { status: 404 });
}

export const POST = withNoStore(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    if (!/^[1-9]\d{0,9}$/.test(id)) return unavailable();
    const requestId = Number(id);
    if (requestId > 2_147_483_647) return unavailable();

    const approvalTokenHash = await readLoginReceipt(req, requestId);
    if (!approvalTokenHash) return unavailable();

    const request = await authRepository.getBoundLoginRequest(
      requestId,
      approvalTokenHash,
    );
    if (!request) return unavailable();

    if (request.status === "declined" || request.status === "expired") {
      return NextResponse.json({ status: request.status });
    }

    const trustedDeviceId = approvedDeviceId(request.status);
    const approved = request.status === "approved" || trustedDeviceId !== null;
    if (request.status !== "pending" && !approved) return unavailable();
    if (request.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ status: "expired" });
    }
    if (!approved) return NextResponse.json({ status: "pending" });

    const user = await userRepository.getUserById(request.userId);
    if (!user) return unavailable();

    const session = await encrypt({
      id: user.id,
      email: user.email,
      role: user.role ?? "unknown",
      permissions: user.permissions,
    });

    const deviceToken =
      trustedDeviceId === null
        ? undefined
        : await authRepository.getTrustedDeviceToken(user.id, trustedDeviceId);

    const consumed = await authRepository.consumeLoginRequest(
      requestId,
      approvalTokenHash,
      request.status,
    );
    if (!consumed) {
      if (request.expiresAt.getTime() <= Date.now()) {
        return NextResponse.json({ status: "expired" });
      }
      return unavailable();
    }

    const response = NextResponse.json({ status: "approved" });
    response.cookies.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 3, // 3 hours
      path: "/",
    });

    if (deviceToken) {
      response.cookies.set("device_token", deviceToken, {
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
