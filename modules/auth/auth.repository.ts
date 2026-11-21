import { randomUUID } from "node:crypto";
import db from "@/lib/drizzle";
import { loginRequests, trustedDevices } from "@/drizzle/schema";
import { eq, and, gt, lte, sql } from "drizzle-orm";
import { InsertLoginRequest, InsertTrustedDevice } from "./auth.types";

// expires_at stores a UTC timestamp without time zone.
const currentTime = sql`(clock_timestamp() at time zone 'UTC')`;

function receiptMatches(requestId: number, approvalTokenHash: string) {
  return and(
    eq(loginRequests.id, requestId),
    sql`encode(sha256(convert_to(${loginRequests.approvalToken}, 'UTF8')), 'hex') = ${approvalTokenHash}`,
  );
}

// The existing status varchar can hold "approved:" plus a serial device ID.
// Keeping the ID with the approval lets polling issue only its exact device token.
export function approvedDeviceId(status: string) {
  const match = /^approved:([1-9]\d{0,9})$/.exec(status);
  const id = match ? Number(match[1]) : 0;
  return id > 0 && id <= 2_147_483_647 ? id : null;
}

export const authRepository = {
  async decideLoginRequest(
    token: string,
    decision: "approved" | "declined",
    remember = false,
  ) {
    return db.transaction(async (tx) => {
      const pendingToken = and(
        eq(loginRequests.approvalToken, token),
        eq(loginRequests.status, "pending"),
      );
      const [request] = await tx
        .update(loginRequests)
        .set({ status: decision })
        .where(and(pendingToken, gt(loginRequests.expiresAt, currentTime)))
        .returning();

      if (!request) {
        const [expired] = await tx
          .update(loginRequests)
          .set({ status: "expired" })
          .where(and(pendingToken, lte(loginRequests.expiresAt, currentTime)))
          .returning({ id: loginRequests.id });
        return expired ? "expired" : "invalid_token";
      }

      if (decision === "approved" && remember) {
        const [device] = await tx
          .insert(trustedDevices)
          .values({
            userId: request.userId,
            deviceFingerprint: request.deviceFingerprint,
            deviceLabel: request.deviceLabel,
            deviceToken: randomUUID(),
            lastUsedAt: new Date(),
          })
          .returning({ id: trustedDevices.id });
        await tx
          .update(loginRequests)
          .set({ status: `approved:${device.id}` })
          .where(eq(loginRequests.id, request.id));
        return "approved_remember";
      }

      return decision;
    });
  },

  async getBoundLoginRequest(requestId: number, approvalTokenHash: string) {
    return db.query.loginRequests.findFirst({
      columns: { status: true, expiresAt: true, userId: true },
      where: receiptMatches(requestId, approvalTokenHash),
    });
  },

  async consumeLoginRequest(
    requestId: number,
    approvalTokenHash: string,
    status: string,
  ) {
    if (status !== "approved" && approvedDeviceId(status) === null)
      return false;
    const [consumed] = await db
      .update(loginRequests)
      .set({ status: "consumed" })
      .where(
        and(
          receiptMatches(requestId, approvalTokenHash),
          eq(loginRequests.status, status),
          gt(loginRequests.expiresAt, currentTime),
        ),
      )
      .returning({ id: loginRequests.id });
    return Boolean(consumed);
  },

  async createLoginRequest(data: InsertLoginRequest) {
    const [newRequest] = await db
      .insert(loginRequests)
      .values(data)
      .returning();
    return newRequest;
  },

  async getTrustedDevice(userId: number, token: string) {
    return db.query.trustedDevices.findFirst({
      where: and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.deviceToken, token),
      ),
    });
  },

  async getTrustedDeviceToken(userId: number, id: number) {
    const device = await db.query.trustedDevices.findFirst({
      columns: { deviceToken: true },
      where: and(eq(trustedDevices.userId, userId), eq(trustedDevices.id, id)),
    });
    return device?.deviceToken;
  },

  async updateTrustedDeviceLastUsed(id: number) {
    return db
      .update(trustedDevices)
      .set({ lastUsedAt: new Date() })
      .where(eq(trustedDevices.id, id));
  },

  async addTrustedDevice(data: InsertTrustedDevice) {
    return db.insert(trustedDevices).values(data);
  },
};
