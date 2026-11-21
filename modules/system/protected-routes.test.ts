import { GET as getCutoffSummary } from "@/app/api/cutoff/summary/route";
import { POST as postCutoff } from "@/app/api/cutoff/route";
import {
  GET as getRolePermissions,
  PUT as putRolePermissions,
} from "@/app/api/roles/[id]/permissions/route";
import { getSession } from "@/lib/auth";
import { roleService } from "@/modules/role/role.service";
import { NextRequest } from "next/server";
import { systemService } from "./system.service";

jest.mock("@/lib/auth", () => ({ getSession: jest.fn() }));
jest.mock("@/modules/role/role.service", () => ({
  roleService: {
    getRolePermissions: jest.fn(),
    updateRolePermissions: jest.fn(),
  },
}));
jest.mock("./system.service", () => ({
  systemService: {
    getUnpaidOrdersSummary: jest.fn(() => ({})),
    performYearlyCutoff: jest.fn(),
  },
}));

const endDate = "2026-12-31";
const roleContext = { params: Promise.resolve({ id: "7" }) };
const roleUrl = "http://localhost/api/roles/7/permissions";
const cutoffUrl = "http://localhost/api/cutoff";

it.each([
  {
    name: "GET role permissions",
    permission: "role.view",
    otherPermission: "role.update",
    handler: () => getRolePermissions(new NextRequest(roleUrl), roleContext),
    service: roleService.getRolePermissions,
    args: [7],
  },
  {
    name: "PUT role permissions",
    permission: "role.update",
    otherPermission: "role.view",
    handler: (valid: boolean) => putRolePermissions(new NextRequest(roleUrl, {
      method: "PUT",
      body: valid ? JSON.stringify({ permissionIds: [3] }) : "not JSON",
    }), roleContext),
    service: roleService.updateRolePermissions,
    args: [7, [3]],
  },
  {
    name: "GET cutoff summary",
    permission: "system.cutoff",
    otherPermission: "role.update",
    handler: (valid: boolean) => getCutoffSummary(new NextRequest(
      `${cutoffUrl}/summary${valid ? `?endDate=${endDate}` : ""}`,
    ), undefined),
    service: systemService.getUnpaidOrdersSummary,
    args: [new Date(endDate)],
  },
  {
    name: "POST cutoff",
    permission: "system.cutoff",
    otherPermission: "role.update",
    handler: (valid: boolean) => postCutoff(new NextRequest(cutoffUrl, {
      method: "POST",
      body: valid ? JSON.stringify({ endDate }) : "not JSON",
    }), undefined),
    service: systemService.performYearlyCutoff,
    args: [new Date(endDate)],
  },
])("$name checks current permissions before inputs and services", async ({
  permission, otherPermission, handler, service, args,
}) => {
  const session = getSession as jest.Mock;
  session
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ permissions: [permission] })
    .mockResolvedValueOnce({ permissions: [otherPermission] });

  const anonymous = await handler(false);
  expect(anonymous.status).toBe(403);
  await expect(anonymous.json()).resolves.toEqual({ message: "Forbidden" });
  expect(service).not.toHaveBeenCalled();

  expect((await handler(true)).status).toBe(200);
  expect(service).toHaveBeenCalledWith(...args);

  const revoked = await handler(false);
  expect(revoked.status).toBe(403);
  await expect(revoked.json()).resolves.toEqual({ message: "Forbidden" });
  expect(service).toHaveBeenCalledTimes(1);
  expect(session).toHaveBeenCalledTimes(3);
});
