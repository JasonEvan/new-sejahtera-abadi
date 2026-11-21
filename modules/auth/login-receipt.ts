import { createHash } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { decrypt, encrypt } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";

const purpose = "login_request_receipt";
export const loginReceiptCookie = "login_request_receipt";
export const loginRequestLifetimeSeconds = 60 * 60;

export function withNoStore<T>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>,
) {
  const handle = withErrorHandler(handler);
  return async (request: NextRequest, context: T) => {
    const response = await handle(request, context);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
}

export function createLoginReceipt(requestId: number, approvalToken: string) {
  return encrypt({
    purpose,
    requestId,
    approvalTokenHash: createHash("sha256").update(approvalToken).digest("hex"),
  });
}

export async function readLoginReceipt(req: NextRequest, requestId: number) {
  const receipt = req.cookies.get(loginReceiptCookie)?.value;
  if (!receipt) return null;

  try {
    const payload = await decrypt(receipt);
    if (
      payload.purpose === purpose &&
      payload.requestId === requestId &&
      !("id" in payload) &&
      !("userId" in payload) &&
      !("sub" in payload) &&
      typeof payload.approvalTokenHash === "string" &&
      /^[a-f0-9]{64}$/.test(payload.approvalTokenHash)
    ) {
      return payload.approvalTokenHash;
    }
  } catch {
    // Invalid or expired receipts are not authorized to poll.
  }

  return null;
}
