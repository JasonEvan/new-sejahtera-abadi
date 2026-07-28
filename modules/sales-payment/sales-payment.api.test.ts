import api from "@/lib/axios";
import {
  createSalesPayment,
  deleteEditReceivablesByInvoice,
  getEditReceivablesByInvoice,
  updateEditReceivablesByInvoice,
} from "./sales-payment.api";

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

describe("sales-payment.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createSalesPayment calls POST /sales-payments with payload", async () => {
    const payload = {
      client_id: 2,
      transaction_number: "TRX-SP-1",
      transaction_date: "2026-04-14",
      cart: [
        { sales_order_id: 10, paid_amount: 20000 },
        { sales_order_id: 11, paid_amount: 30000 },
      ],
    };
    const apiData = { message: "ok" };
    mockedApi.post.mockResolvedValueOnce({ data: apiData } as never);

    const result = await createSalesPayment(payload as never);

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith("/sales-payments", payload);
    expect(result).toEqual(apiData);
  });

  it("getEditReceivablesByInvoice encodes invoice number", async () => {
    const apiData = { data: null };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getEditReceivablesByInvoice("SJ/2026 #001");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/sales-payments/detail?invoice_number=SJ%2F2026%20%23001",
    );
    expect(result).toEqual(apiData);
  });

  it("deleteEditReceivablesByInvoice calls DELETE with body", async () => {
    const payload = { invoice_number: "SJ-100" };
    const apiData = { message: "deleted" };
    mockedApi.delete.mockResolvedValueOnce({ data: apiData } as never);

    const result = await deleteEditReceivablesByInvoice(payload);

    expect(mockedApi.delete).toHaveBeenCalledTimes(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/sales-payments/detail", {
      data: payload,
    });
    expect(result).toEqual(apiData);
  });

  it("updateEditReceivablesByInvoice calls PUT with strict contract", async () => {
    const payload = {
      transaction_number: "TRX-SP-9",
      payments: [
        {
          invoice_number: "SJ-101",
          payment_date: "2026-04-15",
          paid_amount: 15000,
        },
      ],
    };
    const apiData = { message: "updated" };
    mockedApi.put.mockResolvedValueOnce({ data: apiData } as never);

    const result = await updateEditReceivablesByInvoice(payload);

    expect(mockedApi.put).toHaveBeenCalledWith(
      "/sales-payments/detail",
      payload,
    );
    expect(result).toEqual(apiData);
  });

  it("propagates API failure", async () => {
    mockedApi.put.mockRejectedValueOnce(new Error("network"));

    await expect(
      updateEditReceivablesByInvoice({
        transaction_number: "TRX-1",
        payments: [],
      }),
    ).rejects.toThrow("network");
    expect(mockedApi.put).toHaveBeenCalledTimes(1);
  });
});
