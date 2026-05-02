import db from "@/lib/drizzle";
import {
  loginRequests,
  permissions,
  role_permissions,
  trustedDevices,
} from "@/drizzle/schema";
import { eq, and, gt, or } from "drizzle-orm";
import { InsertLoginRequest, InsertTrustedDevice } from "./auth.types";

export const authRepository = {
  async getLoginRequestByToken(token: string) {
    return db.query.loginRequests.findFirst({
      where: and(
        eq(loginRequests.approvalToken, token),
        eq(loginRequests.status, "pending"),
      ),
    });
  },

  async getLoginRequestById(id: number) {
    return db.query.loginRequests.findFirst({
      where: eq(loginRequests.id, id),
      with: { user: { with: { role: true } } },
    });
  },

  async updateLoginRequestStatus(id: number, status: string) {
    return db
      .update(loginRequests)
      .set({ status: status as any })
      .where(eq(loginRequests.id, id));
  },

  async updateLoginRequestStatusByToken(token: string, status: string) {
    return db
      .update(loginRequests)
      .set({ status: status as any })
      .where(
        and(
          eq(loginRequests.approvalToken, token),
          eq(loginRequests.status, "pending"),
        ),
      );
  },

  async getPendingLoginRequest(userId: number) {
    return db.query.loginRequests.findFirst({
      where: and(
        eq(loginRequests.userId, userId),
        eq(loginRequests.status, "pending"),
        gt(loginRequests.expiresAt, new Date()),
      ),
    });
  },

  async createLoginRequest(data: InsertLoginRequest) {
    const [newRequest] = await db
      .insert(loginRequests)
      .values(data)
      .returning();
    return newRequest;
  },

  async getTrustedDevice(userId: number, fingerprint: string, token?: string) {
    const orConditions = [eq(trustedDevices.deviceFingerprint, fingerprint)];
    if (token) {
      orConditions.push(eq(trustedDevices.deviceToken, token));
    }

    return db.query.trustedDevices.findFirst({
      where: and(eq(trustedDevices.userId, userId), or(...orConditions)),
    });
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
