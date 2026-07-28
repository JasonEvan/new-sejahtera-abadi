import api from "@/lib/axios";
import {
  createPurchasePayment,
  deleteEditPayablesByInvoice,
  getEditPayablesByInvoice,
  updateEditPayablesByInvoice,
} from "./purchase-payment.api";

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

describe("purchase-payment.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createPurchasePayment calls POST /purchase-payments with payload", async () => {
    const payload = {
      client_id: 3,
      transaction_number: "TRX-PP-1",
      transaction_date: "2026-04-14",
      cart: [
        { purchase_order_id: 90, paid_amount: 50000 },
        { purchase_order_id: 91, paid_amount: 20000 },
      ],
    };
    const apiData = { message: "ok" };
    mockedApi.post.mockResolvedValueOnce({ data: apiData } as never);

    const result = await createPurchasePayment(payload as never);

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith("/purchase-payments", payload);
    expect(result).toEqual(apiData);
  });

  it("getEditPayablesByInvoice encodes invoice number", async () => {
    const apiData = { data: null };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getEditPayablesByInvoice("PB/2026 #009");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/purchase-payments/detail?invoice_number=PB%2F2026%20%23009",
    );
    expect(result).toEqual(apiData);
  });

  it("deleteEditPayablesByInvoice calls DELETE with body", async () => {
    const payload = { invoice_number: "PB-77" };
    const apiData = { message: "deleted" };
    mockedApi.delete.mockResolvedValueOnce({ data: apiData } as never);

    const result = await deleteEditPayablesByInvoice(payload);

    expect(mockedApi.delete).toHaveBeenCalledWith("/purchase-payments/detail", {
      data: payload,
    });
    expect(result).toEqual(apiData);
  });

  it("updateEditPayablesByInvoice calls PUT with strict contract", async () => {
    const payload = {
      transaction_number: "TRX-PP-9",
      payments: [
        {
          invoice_number: "PB-100",
          payment_date: "2026-04-15",
          paid_amount: 21000,
        },
      ],
    };
    const apiData = { message: "updated" };
    mockedApi.put.mockResolvedValueOnce({ data: apiData } as never);

    const result = await updateEditPayablesByInvoice(payload);

    expect(mockedApi.put).toHaveBeenCalledTimes(1);
    expect(mockedApi.put).toHaveBeenCalledWith(
      "/purchase-payments/detail",
      payload,
    );
    expect(result).toEqual(apiData);
  });

  it("propagates API failure", async () => {
    mockedApi.get.mockRejectedValueOnce(new Error("server down"));

    await expect(getEditPayablesByInvoice("PB-1")).rejects.toThrow(
      "server down",
    );
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
