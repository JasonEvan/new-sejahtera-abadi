import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login-request/[id]/route";
import { decrypt, encrypt } from "@/lib/auth";
import { userRepository } from "@/modules/user/user.repository";
import { authRepository } from "./auth.repository";
import { loginReceiptCookie } from "./login-receipt";

jest.mock("@/lib/auth", () => ({ decrypt: jest.fn(), encrypt: jest.fn() }));
jest.mock("@/lib/drizzle", () => ({ __esModule: true, default: {} }));
jest.mock("@/modules/user/user.repository", () => ({
  userRepository: { getUserById: jest.fn() },
}));

const bound = jest.spyOn(authRepository, "getBoundLoginRequest");
const consume = jest.spyOn(authRepository, "consumeLoginRequest");
const trusted = jest.spyOn(authRepository, "getTrustedDeviceToken");
const receipt = {
  purpose: "login_request_receipt",
  requestId: 10,
  approvalTokenHash: "a".repeat(64),
};

function poll(cookie?: string) {
  return POST(
    new NextRequest("http://localhost/api/auth/login-request/10", {
      method: "POST",
      headers: cookie
        ? { cookie: `${loginReceiptCookie}=${cookie}` }
        : undefined,
    }),
    { params: Promise.resolve({ id: "10" }) },
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(decrypt).mockResolvedValue(receipt);
  jest.mocked(encrypt).mockResolvedValue("signed-session");
  jest.mocked(userRepository.getUserById).mockResolvedValue({
    id: 1,
    email: "test@example.test",
    password: "unused",
    role_id: null,
    role: "test",
    permissions: [],
  });
});

afterAll(() => jest.restoreAllMocks());

it("does not read approval state without a receipt for the requested ID", async () => {
  jest.mocked(decrypt).mockResolvedValue({ ...receipt, requestId: 11 });

  for (const response of await Promise.all([poll(), poll("other-request")])) {
    expect(response.status).toBe(404);
    expect(response.cookies.get("session")).toBeUndefined();
  }
  expect(bound).not.toHaveBeenCalled();
});

it("does not issue or consume an expired approval", async () => {
  bound.mockResolvedValue({
    status: "approved",
    userId: 1,
    expiresAt: new Date(0),
  });

  const response = await poll("request-receipt");

  await expect(response.json()).resolves.toEqual({ status: "expired" });
  expect(response.cookies.get("session")).toBeUndefined();
  expect(consume).not.toHaveBeenCalled();
});

it("only issues session and device cookies to the holder of the successful claim", async () => {
  bound.mockResolvedValue({
    status: "approved:12",
    userId: 1,
    expiresAt: new Date(Date.now() + 60_000),
  });
  trusted.mockImplementation(async (userId, deviceId) =>
    userId === 1 && deviceId === 12 ? "approved-device" : undefined,
  );
  consume.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

  const responses = await Promise.all([
    poll("request-receipt"),
    poll("request-receipt"),
  ]);
  const winner = responses.find((response) => response.status === 200);
  const loser = responses.find((response) => response.status === 404);

  expect(winner?.cookies.get("session")).toMatchObject({ httpOnly: true });
  expect(winner?.cookies.get("device_token")?.value).toBe("approved-device");
  expect(loser?.headers.get("Set-Cookie")).toBeNull();
  expect(winner?.headers.get("Cache-Control")).toBe("no-store");
});
