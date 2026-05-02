import { loginRequests, trustedDevices } from "@/drizzle/schema";

export type LoginRequest = typeof loginRequests.$inferSelect;
export type InsertLoginRequest = typeof loginRequests.$inferInsert;

export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type InsertTrustedDevice = typeof trustedDevices.$inferInsert;
