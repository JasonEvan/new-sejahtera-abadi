import api from "@/lib/axios";
import {
  getEditPurchaseReturnDetail,
  getEditPurchaseReturnInvoices,
  updatePurchaseReturn,
} from "./purchase-return.api";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe("purchase-return.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getEditPurchaseReturnInvoices uses fixed menu query", async () => {
    const apiData = { data: [{ id: 1, invoice_number: "PB-1" }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getEditPurchaseReturnInvoices();

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/returns/purchases?for_menu=true",
    );
    expect(result).toEqual(apiData);
  });

  it("getEditPurchaseReturnDetail uses return_id query", async () => {
    const apiData = {
      data: { transaction_information: {}, lines: [], meta: {} },
    };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getEditPurchaseReturnDetail(42);

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/returns/purchases?return_id=42",
    );
    expect(result).toEqual(apiData);
  });

  it("updatePurchaseReturn sends PUT /returns/purchases", async () => {
    const payload = {
      purchase_return_id: 77,
      return_date: "2026-04-14",
      lines: [{ purchase_order_line_id: 8, return_qty: 3 }],
    };
    const apiData = { message: "updated" };
    mockedApi.put.mockResolvedValueOnce({ data: apiData } as never);

    const result = await updatePurchaseReturn(payload);

    expect(mockedApi.put).toHaveBeenCalledWith("/returns/purchases", payload);
    expect(result).toEqual(apiData);
  });

  it("propagates API failure", async () => {
    mockedApi.get.mockRejectedValueOnce(new Error("boom"));

    await expect(getEditPurchaseReturnInvoices()).rejects.toThrow("boom");
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
