import { GET as getSales } from "@/app/api/sales/route";
import { GET as getEditDetail } from "@/app/api/sales/edit-detail/route";
import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";
import { saleService } from "./sale.service";

jest.mock("@/lib/auth", () => ({ getSession: jest.fn() }));
jest.mock("./sale.service", () => ({
  saleService: {
    getEditEligibleOrders: jest.fn(() => [{ id: 12, invoice_number: "SJ-12" }]),
    getReturnEligibleOrders: jest.fn(() => [{ id: 19, invoice_number: "SJ-19" }]),
    getSaleEditDetail: jest.fn(async () => ({
      lines: [],
      meta: { invoice_value: 100, discount: 0, total: 100 },
    })),
  },
}));

const session = getSession as jest.Mock;
const baseUrl = "http://localhost/api/sales";

it.each([
  {
    label: "edit picker",
    handler: getSales,
    path: "?for_edit=true&client_id=5",
    permission: "sales.update",
    unrelatedPermission: "sales.return.view",
    service: saleService.getEditEligibleOrders,
    args: [5],
  },
  {
    label: "return picker",
    handler: getSales,
    path: "?for_return=true&client_id=5",
    permission: "sales.return.view",
    unrelatedPermission: "sales.update",
    service: saleService.getReturnEligibleOrders,
    args: [5],
  },
  {
    label: "edit detail",
    handler: getEditDetail,
    path: "/edit-detail?client_id=5&sales_order_id=12",
    permission: "sales.update",
    unrelatedPermission: "sales.return.view",
    service: saleService.getSaleEditDetail,
    args: [5, 12],
  },
])("$label requires its own permission", async ({
  handler, path, permission, unrelatedPermission, service, args,
}) => {
  session
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ permissions: [unrelatedPermission] })
    .mockResolvedValueOnce({ permissions: [permission] });
  const request = new NextRequest(`${baseUrl}${path}`);

  for (let i = 0; i < 2; i++) {
    const forbidden = await handler(request, undefined);
    expect(forbidden.status).toBe(403);
    await expect(forbidden.json()).resolves.toEqual({ message: "Forbidden" });
  }
  expect(service).not.toHaveBeenCalled();

  const allowed = await handler(request, undefined);
  expect(allowed.status).toBe(200);
  expect(service).toHaveBeenCalledWith(...args);
});

it.each([
  { handler: getSales, path: "?for_edit=true" },
  { handler: getSales, path: "?for_edit=true&client_id=1.5" },
  { handler: getEditDetail, path: "/edit-detail?sales_order_id=12" },
  { handler: getEditDetail, path: "/edit-detail?client_id=5" },
])("rejects unscoped or invalid edit requests: $path", async ({ handler, path }) => {
  session.mockResolvedValueOnce({ permissions: ["sales.update"] });
  const response = await handler(new NextRequest(`${baseUrl}${path}`), undefined);

  expect(response.status).toBe(400);
  expect(saleService.getEditEligibleOrders).not.toHaveBeenCalled();
  expect(saleService.getSaleEditDetail).not.toHaveBeenCalled();
});
