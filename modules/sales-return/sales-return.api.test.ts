import api from "@/lib/axios";
import {
  getEditSaleReturnDetail,
  getEditSaleReturnInvoices,
  updateSaleReturn,
} from "./sales-return.api";

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

describe("sales-return.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getEditSaleReturnInvoices uses fixed menu query", async () => {
    const apiData = { data: [{ id: 1, invoice_number: "SJ-1" }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getEditSaleReturnInvoices();

    expect(mockedApi.get).toHaveBeenCalledWith("/returns/sales?for_menu=true");
    expect(result).toEqual(apiData);
  });

  it("getEditSaleReturnDetail uses return_id query", async () => {
    const apiData = {
      data: { transaction_information: {}, lines: [], meta: {} },
    };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getEditSaleReturnDetail(41);

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/returns/sales?return_id=41",
    );
    expect(result).toEqual(apiData);
  });

  it("updateSaleReturn sends PUT /returns/sales", async () => {
    const payload = {
      sales_return_id: 22,
      return_date: "2026-04-14",
      lines: [{ sales_order_line_id: 10, return_qty: 2 }],
    };
    const apiData = { message: "updated" };
    mockedApi.put.mockResolvedValueOnce({ data: apiData } as never);

    const result = await updateSaleReturn(payload);

    expect(mockedApi.put).toHaveBeenCalledWith("/returns/sales", payload);
    expect(result).toEqual(apiData);
  });

  it("propagates API failure", async () => {
    mockedApi.put.mockRejectedValueOnce(new Error("timeout"));

    await expect(
      updateSaleReturn({
        sales_return_id: 1,
        return_date: "2026-04-14",
        lines: [],
      }),
    ).rejects.toThrow("timeout");
    expect(mockedApi.put).toHaveBeenCalledTimes(1);
  });
});
