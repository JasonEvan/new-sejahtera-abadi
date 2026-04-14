import db from "@/lib/drizzle";
import { AppError } from "@/lib/errors";
import { clientRepository } from "../client/client.repository";
import { purchaseOrderRepository } from "../purchase/purchase-order.repository";
import { purchasePaymentRepository } from "./purchase-payment.repository";
import { purchasePaymentService } from "./purchase-payment.service";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

jest.mock("./purchase-payment.repository", () => ({
  purchasePaymentRepository: {
    createPurchasePayment: jest.fn(),
    getEditPayablesByInvoice: jest.fn(),
    getByPurchaseOrderId: jest.fn(),
    deleteByPurchaseOrderId: jest.fn(),
    insertEditPayablesPaymentRows: jest.fn(),
  },
}));

jest.mock("../purchase/purchase-order.repository", () => ({
  purchaseOrderRepository: {
    bulkIncPaidAmountAndDecBalanceDue: jest.fn(),
    getByInvoiceNumber: jest.fn(),
    updatePaidAndBalanceDue: jest.fn(),
  },
}));

jest.mock("../client/client.repository", () => ({
  clientRepository: {
    decPayableBalance: jest.fn(),
    incPayableBalance: jest.fn(),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;
const mockedTransaction = mockedDb.transaction as unknown as jest.Mock;
const mockedPaymentRepo = purchasePaymentRepository as jest.Mocked<
  typeof purchasePaymentRepository
>;
const mockedOrderRepo = purchaseOrderRepository as jest.Mocked<
  typeof purchaseOrderRepository
>;
const mockedClientRepo = clientRepository as jest.Mocked<
  typeof clientRepository
>;

describe("purchase-payment.service", () => {
  const tx = {};

  const createPayload = {
    client_id: 7,
    transaction_number: "TRX-PP-1",
    transaction_date: "2026-04-14",
    cart: [
      { purchase_order_id: 10, paid_amount: 30000 },
      { purchase_order_id: 11, paid_amount: 70000 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation(
      async (cb: (txArg: unknown) => unknown) => cb(tx),
    );
  });

  it("createPurchasePayment executes write flow and decrements payable by cart total", async () => {
    await purchasePaymentService.createPurchasePayment(createPayload as never);

    expect(mockedPaymentRepo.createPurchasePayment).toHaveBeenCalledWith(
      createPayload,
      tx,
    );
    expect(
      mockedOrderRepo.bulkIncPaidAmountAndDecBalanceDue,
    ).toHaveBeenCalledWith(createPayload.cart, tx);
    expect(mockedClientRepo.decPayableBalance).toHaveBeenCalledWith(
      7,
      100000,
      tx,
    );
  });

  it("getEditPayablesByInvoice returns null when no invoice is found", async () => {
    mockedPaymentRepo.getEditPayablesByInvoice.mockResolvedValueOnce(
      null as never,
    );

    await expect(
      purchasePaymentService.getEditPayablesByInvoice("PB-404"),
    ).resolves.toBeNull();
  });

  it("getEditPayablesByInvoice formats payment_date to YYYY-MM-DD", async () => {
    mockedPaymentRepo.getEditPayablesByInvoice.mockResolvedValueOnce({
      invoice: {
        invoice_number: "PB-1",
        invoice_value: 60000,
        paid_amount: 20000,
        balance_due: 40000,
      },
      payments: [
        {
          id: 1,
          transaction_number: "TRX-1",
          payment_date: new Date("2026-04-14T10:00:00.000Z"),
          paid_amount: 10000,
        },
      ],
    } as never);

    const result =
      await purchasePaymentService.getEditPayablesByInvoice("PB-1");

    expect(result).toEqual({
      invoice_number: "PB-1",
      invoice_value: 60000,
      paid_amount: 20000,
      balance_due: 40000,
      payments: [
        {
          id: 1,
          transaction_number: "TRX-1",
          payment_date: "2026-04-14",
          paid_amount: 10000,
        },
      ],
    });
  });

  it("deleteEditPayablesByInvoice throws AppError when invoice does not exist", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce(
      undefined as never,
    );

    await expect(
      purchasePaymentService.deleteEditPayablesByInvoice({
        invoice_number: "PB-X",
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Invoice not found",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("deleteEditPayablesByInvoice only deletes rows when old total paid is zero", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 1,
      client_id: 2,
      paid_amount: 0,
      balance_due: 50000,
    } as never);
    mockedPaymentRepo.getByPurchaseOrderId.mockResolvedValueOnce([] as never);

    const result = await purchasePaymentService.deleteEditPayablesByInvoice({
      invoice_number: "PB-1",
    });

    expect(mockedPaymentRepo.deleteByPurchaseOrderId).toHaveBeenCalledWith(
      1,
      tx,
    );
    expect(mockedOrderRepo.updatePaidAndBalanceDue).not.toHaveBeenCalled();
    expect(mockedClientRepo.incPayableBalance).not.toHaveBeenCalled();
    expect(result).toEqual({ message: "Payments deleted successfully" });
  });

  it("deleteEditPayablesByInvoice restores order/client balances when payments existed", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 9,
      client_id: 1,
      paid_amount: 40000,
      balance_due: 8000,
    } as never);
    mockedPaymentRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 1, paid_amount: 12000 },
      { id: 2, paid_amount: 6000 },
    ] as never);

    await purchasePaymentService.deleteEditPayablesByInvoice({
      invoice_number: "PB-9",
    });

    expect(mockedOrderRepo.updatePaidAndBalanceDue).toHaveBeenCalledWith(
      9,
      {
        paid_amount: 22000,
        balance_due: 26000,
      },
      tx,
    );
    expect(mockedClientRepo.incPayableBalance).toHaveBeenCalledWith(
      1,
      18000,
      tx,
    );
  });

  it("updateEditPayablesByInvoice throws when invoice does not exist", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce(
      undefined as never,
    );

    await expect(
      purchasePaymentService.updateEditPayablesByInvoice({
        invoice_number: "PB-X",
        payments: [],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Invoice not found",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("updateEditPayablesByInvoice rejects when new paid total exceeds invoice value", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 13,
      client_id: 2,
      invoice_value: 40000,
    } as never);
    mockedPaymentRepo.getByPurchaseOrderId.mockResolvedValueOnce([] as never);

    await expect(
      purchasePaymentService.updateEditPayablesByInvoice({
        invoice_number: "PB-13",
        payments: [
          {
            transaction_number: "TRX-OVR",
            payment_date: "2026-04-15",
            paid_amount: 41000,
          },
        ],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Total paid amount cannot exceed invoice value",
        statusCode: 400,
      }) as AppError,
    );

    expect(mockedPaymentRepo.deleteByPurchaseOrderId).not.toHaveBeenCalled();
  });

  it("updateEditPayablesByInvoice updates paid/balance and decreases payable on positive delta", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 5,
      client_id: 2,
      invoice_value: 90000,
    } as never);
    mockedPaymentRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 10, paid_amount: 10000 },
    ] as never);

    const result = await purchasePaymentService.updateEditPayablesByInvoice({
      invoice_number: "PB-5",
      payments: [
        {
          transaction_number: "TRX-N1",
          payment_date: "2026-04-14",
          paid_amount: 25000,
        },
      ],
    });

    expect(mockedPaymentRepo.deleteByPurchaseOrderId).toHaveBeenCalledWith(
      5,
      tx,
    );
    expect(
      mockedPaymentRepo.insertEditPayablesPaymentRows,
    ).toHaveBeenCalledWith(
      {
        client_id: 2,
        purchase_order_id: 5,
        payments: [
          {
            transaction_number: "TRX-N1",
            payment_date: "2026-04-14",
            paid_amount: 25000,
          },
        ],
      },
      tx,
    );
    expect(mockedOrderRepo.updatePaidAndBalanceDue).toHaveBeenCalledWith(
      5,
      { paid_amount: 25000, balance_due: 65000 },
      tx,
    );
    expect(mockedClientRepo.decPayableBalance).toHaveBeenCalledWith(
      2,
      15000,
      tx,
    );
    expect(result).toEqual({ message: "Payments updated successfully" });
  });

  it("updateEditPayablesByInvoice increases payable on negative delta", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 6,
      client_id: 4,
      invoice_value: 90000,
    } as never);
    mockedPaymentRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 1, paid_amount: 50000 },
    ] as never);

    await purchasePaymentService.updateEditPayablesByInvoice({
      invoice_number: "PB-6",
      payments: [
        {
          transaction_number: "TRX-LOW",
          payment_date: "2026-04-15",
          paid_amount: 30000,
        },
      ],
    });

    expect(mockedClientRepo.incPayableBalance).toHaveBeenCalledWith(
      4,
      20000,
      tx,
    );
    expect(mockedClientRepo.decPayableBalance).not.toHaveBeenCalled();
  });

  it("updateEditPayablesByInvoice does not mutate client balance when delta is zero", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 7,
      client_id: 8,
      invoice_value: 90000,
    } as never);
    mockedPaymentRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 1, paid_amount: 35000 },
    ] as never);

    await purchasePaymentService.updateEditPayablesByInvoice({
      invoice_number: "PB-7",
      payments: [
        {
          transaction_number: "TRX-SAME",
          payment_date: "2026-04-15",
          paid_amount: 35000,
        },
      ],
    });

    expect(mockedClientRepo.incPayableBalance).not.toHaveBeenCalled();
    expect(mockedClientRepo.decPayableBalance).not.toHaveBeenCalled();
  });
});
