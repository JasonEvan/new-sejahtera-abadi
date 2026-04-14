import api from "@/lib/axios";
import {
  createPurchase,
  createPurchaseReturn,
  getLatestPurchasedItemsByClient,
  getOrdersMenu,
  getPurchaseInvoiceDetail,
  getPurchaseInvoices,
  getPurchaseReturnLines,
  getReturnEligibleOrders,
  updatePurchase,
} from "./purchase.api";

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

describe("purchase.api", () => {
  const createPayload = {
    client_id: 1,
    total: 200000,
    discount: 5000,
    cart: [
      {
        stock_id: 2,
        name: "Steel",
        quantity: 10,
        product_price: 10000,
        selling_price: 12000,
      },
    ],
  };

  const editPayload = {
    client_id: 1,
    total: 180000,
    discount: 0,
    cart: [
      {
        stock_id: 2,
        name: "Steel",
        quantity: 9,
        product_price: 10000,
        selling_price: 12000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createPurchase calls POST /purchases with payload", async () => {
    const apiData = { message: "ok" };
    mockedApi.post.mockResolvedValueOnce({ data: apiData } as never);

    const result = await createPurchase(createPayload as never);

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith("/purchases", createPayload);
    expect(result).toEqual(apiData);
  });

  it("updatePurchase calls PUT /purchases/:id with payload", async () => {
    const apiData = { message: "updated" };
    mockedApi.put.mockResolvedValueOnce({ data: apiData } as never);

    const result = await updatePurchase(44, editPayload as never);

    expect(mockedApi.put).toHaveBeenCalledTimes(1);
    expect(mockedApi.put).toHaveBeenCalledWith("/purchases/44", editPayload);
    expect(result).toEqual(apiData);
  });

  it("getOrdersMenu builds strict query params", async () => {
    const apiData = { data: [{ id: 1 }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getOrdersMenu(7, true);

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/purchases?client_id=7&is_paid_off=true&for_menu=true",
    );
    expect(result).toEqual(apiData);
  });

  it("getPurchaseInvoices encodes invoice prefix", async () => {
    const apiData = { data: [] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getPurchaseInvoices("INV/2026 #A");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/purchases?invoice_prefix=INV%2F2026%20%23A",
    );
    expect(result).toEqual(apiData);
  });

  it("getPurchaseInvoiceDetail encodes invoice number", async () => {
    const apiData = { data: { header: {}, lines: [] } };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getPurchaseInvoiceDetail("PB/001 2026");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/purchases/detail?invoice_number=PB%2F001%202026",
    );
    expect(result).toEqual(apiData);
  });

  it("getReturnEligibleOrders uses fixed query contract", async () => {
    const apiData = { data: [{ id: 2, invoice_number: "PB-2" }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getReturnEligibleOrders(9);

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/purchases?for_return=true&client_id=9",
    );
    expect(result).toEqual(apiData);
  });

  it("getPurchaseReturnLines encodes invoice number", async () => {
    const apiData = { data: { header: {}, lines: [] } };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getPurchaseReturnLines("PB/1 #R");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/purchases/return-lines?invoice_number=PB%2F1%20%23R",
    );
    expect(result).toEqual(apiData);
  });

  it("createPurchaseReturn posts to /returns/purchases", async () => {
    const apiData = { message: "return created" };
    mockedApi.post.mockResolvedValueOnce({ data: apiData } as never);

    const payload = {
      purchase_order_id: 1,
      returned_at: "2026-04-14",
      notes: "Defect",
      items: [{ stock_id: 2, qty: 1 }],
    };

    const result = await createPurchaseReturn(payload as never);

    expect(mockedApi.post).toHaveBeenCalledWith("/returns/purchases", payload);
    expect(result).toEqual(apiData);
  });

  it("getLatestPurchasedItemsByClient builds URLSearchParams correctly", async () => {
    const apiData = {
      data: [{ name: "Steel", price: 10000, bought_at: "2026-04-10" }],
    };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getLatestPurchasedItemsByClient(11, "Ste");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/purchases/bought-items?client_id=11&name_prefix=Ste",
    );
    expect(result).toEqual(apiData);
  });

  it("propagates API failures", async () => {
    const err = new Error("network");
    mockedApi.get.mockRejectedValueOnce(err);

    await expect(getPurchaseInvoices("X")).rejects.toThrow("network");
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
