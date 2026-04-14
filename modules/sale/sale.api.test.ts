import api from "@/lib/axios";
import {
  createSale,
  createSaleReturn,
  getLatestSoldItemsByClient,
  getOrdersMenu,
  getReturnEligibleOrders,
  getSaleReturnLines,
  getSalesInvoiceDetail,
  getSalesInvoices,
  updateSale,
} from "./sale.api";

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

describe("sale.api", () => {
  const createPayload = {
    client_id: 1,
    salesman_id: 3,
    total: 300000,
    discount: 10000,
    cart: [
      {
        stock_id: 2,
        name: "Pipe",
        quantity: 5,
        selling_price: 70000,
        capital_cost: 50000,
      },
    ],
  };

  const editPayload = {
    client_id: 1,
    total: 260000,
    discount: 5000,
    cart: [
      {
        stock_id: 2,
        name: "Pipe",
        quantity: 4,
        selling_price: 70000,
        capital_cost: 50000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createSale calls POST /sales with payload", async () => {
    const apiData = { message: "ok" };
    mockedApi.post.mockResolvedValueOnce({ data: apiData } as never);

    const result = await createSale(createPayload as never);

    expect(mockedApi.post).toHaveBeenCalledWith("/sales", createPayload);
    expect(result).toEqual(apiData);
  });

  it("updateSale calls PUT /sales/:id with payload", async () => {
    const apiData = { message: "updated" };
    mockedApi.put.mockResolvedValueOnce({ data: apiData } as never);

    const result = await updateSale(88, editPayload as never);

    expect(mockedApi.put).toHaveBeenCalledWith("/sales/88", editPayload);
    expect(result).toEqual(apiData);
  });

  it("getOrdersMenu builds strict query params", async () => {
    const apiData = { data: [{ id: 1 }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getOrdersMenu(9, false);

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/sales?client_id=9&is_paid_off=false&for_menu=true",
    );
    expect(result).toEqual(apiData);
  });

  it("getSalesInvoices encodes invoice prefix", async () => {
    const apiData = { data: [] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getSalesInvoices("SJ/2026 #A");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/sales?invoice_prefix=SJ%2F2026%20%23A",
    );
    expect(result).toEqual(apiData);
  });

  it("getSalesInvoiceDetail encodes invoice number", async () => {
    const apiData = { data: { header: {}, lines: [] } };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getSalesInvoiceDetail("SJ/001 2026");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/sales/detail?invoice_number=SJ%2F001%202026",
    );
    expect(result).toEqual(apiData);
  });

  it("getReturnEligibleOrders uses fixed query contract", async () => {
    const apiData = { data: [{ id: 2, invoice_number: "SJ-2" }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getReturnEligibleOrders(5);

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/sales?for_return=true&client_id=5",
    );
    expect(result).toEqual(apiData);
  });

  it("getSaleReturnLines encodes invoice number", async () => {
    const apiData = { data: { header: {}, lines: [] } };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getSaleReturnLines("SJ/1 #R");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/sales/return-lines?invoice_number=SJ%2F1%20%23R",
    );
    expect(result).toEqual(apiData);
  });

  it("createSaleReturn posts to /returns/sales", async () => {
    const apiData = { message: "return created" };
    mockedApi.post.mockResolvedValueOnce({ data: apiData } as never);

    const payload = {
      sales_order_id: 1,
      returned_at: "2026-04-14",
      notes: "Defect",
      items: [{ stock_id: 2, qty: 1 }],
    };

    const result = await createSaleReturn(payload as never);

    expect(mockedApi.post).toHaveBeenCalledWith("/returns/sales", payload);
    expect(result).toEqual(apiData);
  });

  it("getLatestSoldItemsByClient builds URLSearchParams correctly", async () => {
    const apiData = {
      data: [{ name: "Pipe", price: 70000, sold_at: "2026-04-10" }],
    };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getLatestSoldItemsByClient(11, "Pi");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/sales/sold-items?client_id=11&name_prefix=Pi",
    );
    expect(result).toEqual(apiData);
  });

  it("propagates API failures", async () => {
    const err = new Error("network");
    mockedApi.post.mockRejectedValueOnce(err);

    await expect(createSale(createPayload as never)).rejects.toThrow("network");
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
  });
});
