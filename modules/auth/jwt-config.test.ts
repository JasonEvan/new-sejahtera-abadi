import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";
import { decrypt, encrypt } from "@/lib/auth";
import config from "../../next.config";

jest.mock("jose", () => ({ SignJWT: jest.fn(), jwtVerify: jest.fn() }));
jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/modules/user/user.repository", () => ({ userRepository: {} }));

const originalSecret = process.env.JWT_SECRET;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

it.each([undefined, "", " \t "])(
  "rejects a missing or blank JWT secret (%p) at runtime, but not at build time",
  async (secret) => {
    if (secret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = secret;
    }

    expect(() => config(PHASE_PRODUCTION_BUILD)).not.toThrow();
    expect(() => config(PHASE_DEVELOPMENT_SERVER)).toThrow("JWT_SECRET");
    expect(() => config(PHASE_PRODUCTION_SERVER)).toThrow("JWT_SECRET");
    await expect(encrypt({ id: 1 })).rejects.toThrow("JWT_SECRET");
    await expect(decrypt("unused")).rejects.toThrow("JWT_SECRET");
  },
);

it("accepts a configured JWT secret at dev and production startup", () => {
  process.env.JWT_SECRET = "test-only-jwt-secret";

  expect(() => config(PHASE_DEVELOPMENT_SERVER)).not.toThrow();
  expect(() => config(PHASE_PRODUCTION_SERVER)).not.toThrow();
});
