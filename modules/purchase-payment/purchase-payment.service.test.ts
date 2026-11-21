import db from "@/lib/drizzle";
import { AppError } from "@/lib/errors";
import { clientRepository } from "../client/client.repository";
import { purchaseOrderRepository } from "../purchase/purchase-order.repository";
import { purchasePaymentRepository } from "./purchase-payment.repository";
import { purchasePaymentService } from "./purchase-payment.service";
import { backendPurchasePaymentValidation } from "./purchase-payment.validation";

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
    getById: jest.fn(),
    getByPurchaseOrderId: jest.fn(),
    deleteByPurchaseOrderId: jest.fn(),
    insertEditPayablesPaymentRows: jest.fn(),
    getTransactionSummary: jest.fn(),
    getByTransactionNumber: jest.fn(),
    deleteByTransactionNumber: jest.fn(),
    insertTransactionPayments: jest.fn(),
  },
}));

jest.mock("../purchase/purchase-order.repository", () => ({
  purchaseOrderRepository: {
    bulkIncPaidAmountAndDecBalanceDue: jest.fn(),
    bulkDecPaidAmountAndIncBalanceDue: jest.fn(),
    getOrdersForUpdate: jest.fn(),
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
  const tx = { execute: jest.fn() };

  const createPayload = {
    client_id: 7,
    transaction_number: "TRX-PP-1",
    transaction_date: "2026-04-14",
    cart: [
      { purchase_order_id: 10, paid_amount: 30000, balance_due: 1 },
      { purchase_order_id: 11, paid_amount: 70000, balance_due: 70000 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation(
      async (cb: (txArg: unknown) => unknown) => cb(tx),
    );
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValue([]);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValue([]);
  });

  it("creates a payment against current balances even if the client's balance snapshot is lower", async () => {
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([
      { id: 10, client_id: 7, invoice_number: "PB-10", balance_due: 30000 },
      { id: 11, client_id: 7, invoice_number: "PB-11", balance_due: 70000 },
    ] as never);

    await purchasePaymentService.createPurchasePayment(
      backendPurchasePaymentValidation.parse(createPayload),
    );

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

  it.each([
    { clientId: 7, balance: 50000, message: /melebihi saldo/ },
    { clientId: 8, balance: 60000, message: /tidak sesuai dengan klien/ },
  ])("rejects invalid create allocation ($message) before writes", async ({
    clientId,
    balance,
    message,
  }) => {
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([
      { id: 10, client_id: clientId, invoice_number: "PB-10", balance_due: balance },
    ] as never);

    await expect(
      purchasePaymentService.createPurchasePayment({
        ...createPayload,
        cart: [
          { ...createPayload.cart[0], balance_due: 99999 },
          { ...createPayload.cart[0], balance_due: 99999 },
        ],
      }),
    ).rejects.toThrow(message);
    expect(mockedPaymentRepo.createPurchasePayment).not.toHaveBeenCalled();
    expect(mockedOrderRepo.bulkIncPaidAmountAndDecBalanceDue).not.toHaveBeenCalled();
    expect(mockedClientRepo.decPayableBalance).not.toHaveBeenCalled();
  });

  it("checks for a duplicate transaction only after acquiring the domain lock", async () => {
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { id: 1 },
    ] as never);
    const { promise, resolve: releaseLock } = Promise.withResolvers<void>();
    tx.execute.mockReturnValueOnce(promise);

    const pending = purchasePaymentService.createPurchasePayment(createPayload);
    try {
      expect(mockedPaymentRepo.getByTransactionNumber).not.toHaveBeenCalled();
    } finally {
      releaseLock();
    }
    await expect(pending).rejects.toThrow("Nomor transaksi sudah digunakan");
    expect(mockedPaymentRepo.getByTransactionNumber).toHaveBeenCalledWith(
      createPayload.transaction_number,
      tx,
    );
    expect(mockedPaymentRepo.createPurchasePayment).not.toHaveBeenCalled();
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
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([]);

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
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([{
      id: 1,
      client_id: 2,
      paid_amount: 0,
      balance_due: 50000,
    }] as never);
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
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([{
      id: 9,
      client_id: 1,
      paid_amount: 40000,
      balance_due: 8000,
    }] as never);
    mockedPaymentRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 1, paid_amount: 12000 },
      { id: 2, paid_amount: 6000 },
    ] as never);

    await purchasePaymentService.deleteEditPayablesByInvoice({
      invoice_number: "PB-9",
    });

    expect(tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
      mockedOrderRepo.getOrdersForUpdate.mock.invocationCallOrder[0],
    );
    expect(mockedOrderRepo.getOrdersForUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mockedPaymentRepo.getByPurchaseOrderId.mock.invocationCallOrder[0],
    );

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

  it("updateEditPayablesByInvoice throws when transaction does not exist", async () => {
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([] as never);

    await expect(
      purchasePaymentService.updateEditPayablesByInvoice({
        transaction_number: "PB-X",
        payments: [],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Transaksi tidak ditemukan",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("updateEditPayablesByInvoice updates paid/balance and decreases payable on positive delta", async () => {
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { id: 10, client_id: 2, purchase_order_id: 5, paid_amount: 4000, payment_date: new Date() },
      { id: 11, client_id: 2, purchase_order_id: 5, paid_amount: 6000, payment_date: new Date() },
    ] as never);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([
      {
        id: 5,
        client_id: 2,
        invoice_number: "PB-5",
        balance_due: 15000,
      },
    ] as never);

    const result = await purchasePaymentService.updateEditPayablesByInvoice({
      transaction_number: "TRX-N1",
      payments: [
        {
          invoice_number: "PB-5",
          payment_date: "2026-04-14",
          paid_amount: 25000,
        },
      ],
    });

    expect(mockedPaymentRepo.deleteByTransactionNumber).toHaveBeenCalledWith(
      "TRX-N1",
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
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { id: 1, client_id: 4, purchase_order_id: 6, paid_amount: 50000, payment_date: new Date() },
    ] as never);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([
      {
        id: 6,
        client_id: 4,
        invoice_number: "PB-6",
        balance_due: 0,
      },
    ] as never);

    await purchasePaymentService.updateEditPayablesByInvoice({
      transaction_number: "TRX-LOW",
      payments: [
        {
          invoice_number: "PB-6",
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
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { id: 1, client_id: 8, purchase_order_id: 7, paid_amount: 35000, payment_date: new Date() },
    ] as never);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([
      {
        id: 7,
        client_id: 8,
        invoice_number: "PB-7",
        balance_due: 0,
      },
    ] as never);

    await purchasePaymentService.updateEditPayablesByInvoice({
      transaction_number: "TRX-SAME",
      payments: [
        {
          invoice_number: "PB-7",
          payment_date: "2026-04-15",
          paid_amount: 35000,
        },
      ],
    });

    expect(mockedClientRepo.incPayableBalance).not.toHaveBeenCalled();
    expect(mockedClientRepo.decPayableBalance).not.toHaveBeenCalled();
  });

  it.each([
    { newClient: 2, message: /melebihi saldo/ },
    { newClient: 3, message: /tidak sesuai dengan klien/ },
  ])("rejects invalid edits ($message) before reversing any payment", async ({
    newClient,
    message,
  }) => {
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { client_id: 2, purchase_order_id: 5, paid_amount: 4000 },
      { client_id: 2, purchase_order_id: 5, paid_amount: 6000 },
      { client_id: 2, purchase_order_id: 6, paid_amount: 3000 },
    ] as never);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([
      { id: 5, client_id: 2, invoice_number: "PB-5", balance_due: 15000 },
      { id: 6, client_id: 2, invoice_number: "PB-6", balance_due: 0 },
      { id: 7, client_id: newClient, invoice_number: "PB-7", balance_due: 5000 },
    ] as never);

    await expect(
      purchasePaymentService.updateEditPayablesByInvoice({
        transaction_number: "TRX-N1",
        payments: [
          { invoice_number: "PB-5", paid_amount: 13000 },
          { invoice_number: "PB-5", paid_amount: 13000 },
          { invoice_number: "PB-7", paid_amount: 1000 },
        ],
      }),
    ).rejects.toThrow(message);

    expect(mockedOrderRepo.getOrdersForUpdate).toHaveBeenCalledTimes(1);
    expect(mockedOrderRepo.getOrdersForUpdate).toHaveBeenCalledWith(
      { ids: [5, 6], invoiceNumbers: ["PB-5", "PB-7"] },
      tx,
    );
    expect(tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
      mockedPaymentRepo.getByTransactionNumber.mock.invocationCallOrder[0],
    );
    expect(mockedOrderRepo.bulkDecPaidAmountAndIncBalanceDue).not.toHaveBeenCalled();
    expect(mockedPaymentRepo.deleteByTransactionNumber).not.toHaveBeenCalled();
    expect(mockedPaymentRepo.insertTransactionPayments).not.toHaveBeenCalled();
  });

  it("resolves the transaction ID after locking before restoring order and client balances", async () => {
    const payments = [{ client_id: 2, purchase_order_id: 5, paid_amount: 4000 }];
    mockedPaymentRepo.getById.mockResolvedValueOnce({
      transaction_number: "TRX-N1",
    } as never);
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce(payments as never);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([
      { id: 5, client_id: 2 },
    ] as never);

    await purchasePaymentService.deletePaymentTransaction(10);

    expect(tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
      mockedPaymentRepo.getById.mock.invocationCallOrder[0],
    );
    expect(mockedPaymentRepo.getById).toHaveBeenCalledWith(10, tx);
    expect(mockedPaymentRepo.getByTransactionNumber).toHaveBeenCalledWith("TRX-N1", tx);
    expect(mockedOrderRepo.getOrdersForUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mockedOrderRepo.bulkDecPaidAmountAndIncBalanceDue.mock.invocationCallOrder[0],
    );
    expect(mockedOrderRepo.bulkDecPaidAmountAndIncBalanceDue).toHaveBeenCalledWith(payments, tx);
    expect(mockedClientRepo.incPayableBalance).toHaveBeenCalledWith(2, 4000, tx);
    expect(mockedPaymentRepo.deleteByTransactionNumber).toHaveBeenCalledWith("TRX-N1", tx);
  });
});
