import db from "@/lib/drizzle";
import { AppError } from "@/lib/errors";
import { clientRepository } from "../client/client.repository";
import { saleOrderRepository } from "../sale/sale-order.repository";
import { salesPaymentRepository } from "./sales-payment.repository";
import { salesPaymentService } from "./sales-payment.service";
import { backendSalesPaymentValidation } from "./sales-payment.validation";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

jest.mock("./sales-payment.repository", () => ({
  salesPaymentRepository: {
    createSalesPayment: jest.fn(),
    getEditReceivablesByInvoice: jest.fn(),
    getBySalesOrderId: jest.fn(),
    deleteBySalesOrderId: jest.fn(),
    getById: jest.fn(),
    insertEditReceivablesPaymentRows: jest.fn(),
    getTransactionSummary: jest.fn(),
    getByTransactionNumber: jest.fn(),
    deleteByTransactionNumber: jest.fn(),
    insertTransactionPayments: jest.fn(),
  },
}));

jest.mock("../sale/sale-order.repository", () => ({
  saleOrderRepository: {
    bulkIncPaidAmountAndDecBalanceDue: jest.fn(),
    bulkDecPaidAmountAndIncBalanceDue: jest.fn(),
    getOrdersForUpdate: jest.fn(),
    updatePaidAndBalanceDue: jest.fn(),
  },
}));

jest.mock("../client/client.repository", () => ({
  clientRepository: {
    decReceivableBalance: jest.fn(),
    incReceivableBalance: jest.fn(),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;
const mockedTransaction = mockedDb.transaction as unknown as jest.Mock;
const mockedPaymentRepo = salesPaymentRepository as jest.Mocked<
  typeof salesPaymentRepository
>;
const mockedOrderRepo = saleOrderRepository as jest.Mocked<
  typeof saleOrderRepository
>;
const mockedClientRepo = clientRepository as jest.Mocked<
  typeof clientRepository
>;

describe("sales-payment.service", () => {
  const tx = { execute: jest.fn() };

  function order(id: number, client_id: number, balance_due: number, paid_amount = 0) {
    return {
      id,
      client_id,
      balance_due,
      paid_amount,
      invoice_number: `SJ-${id}`,
      invoice_value: balance_due + paid_amount,
    };
  }

  const createPayload = {
    client_id: 7,
    transaction_number: "TRX-SP-1",
    transaction_date: "2026-04-14",
    cart: [
      { sales_order_id: 10, paid_amount: 20000, balance_due: 1 },
      { sales_order_id: 11, paid_amount: 30000, balance_due: 30000 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation(
      async (cb: (txArg: unknown) => unknown) => cb(tx),
    );
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValue([]);
  });

  it("createSalesPayment executes write flow and decrements receivable by cart total", async () => {
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([
      order(10, 7, 20000),
      order(11, 7, 30000),
    ]);
    const data = backendSalesPaymentValidation.parse(createPayload);
    await salesPaymentService.createSalesPayment(data);

    expect(mockedPaymentRepo.createSalesPayment).toHaveBeenCalledWith(
      createPayload,
      tx,
    );
    expect(
      mockedOrderRepo.bulkIncPaidAmountAndDecBalanceDue,
    ).toHaveBeenCalledWith(createPayload.cart, tx);
    expect(mockedClientRepo.decReceivableBalance).toHaveBeenCalledWith(
      7,
      50000,
      tx,
    );
  });

  it.each([
    { reason: "stale balance", lockedOrder: order(10, 7, 39999), message: /melebihi saldo/ },
    { reason: "another client's invoice", lockedOrder: order(10, 8, 90000), message: /bukan milik/ },
  ])("rejects a cart with $reason before writing", async ({ lockedOrder, message }) => {
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([lockedOrder]);
    const data = {
      ...createPayload,
      cart: [
        { ...createPayload.cart[0], balance_due: 90000 },
        { sales_order_id: 10, paid_amount: 20000, balance_due: 90000 },
      ],
    };

    await expect(salesPaymentService.createSalesPayment(data)).rejects.toThrow(message);
    expect(mockedPaymentRepo.createSalesPayment).not.toHaveBeenCalled();
    expect(mockedOrderRepo.bulkIncPaidAmountAndDecBalanceDue).not.toHaveBeenCalled();
    expect(mockedClientRepo.decReceivableBalance).not.toHaveBeenCalled();
  });

  it("checks for a duplicate transaction only after acquiring the transaction lock", async () => {
    const { promise, resolve: releaseLock } = Promise.withResolvers<void>();
    tx.execute.mockReturnValueOnce(promise);
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      {
        id: 1,
        client_id: 7,
        sales_order_id: 10,
        paid_amount: 20000,
        payment_date: new Date(),
      },
    ]);

    const pending = salesPaymentService.createSalesPayment(createPayload);
    try {
      expect(tx.execute).toHaveBeenCalledTimes(1);
      expect(mockedPaymentRepo.getByTransactionNumber).not.toHaveBeenCalled();
    } finally {
      releaseLock();
    }
    await expect(pending).rejects.toThrow("Nomor transaksi sudah digunakan");
    expect(mockedPaymentRepo.getByTransactionNumber).toHaveBeenCalledWith(
      createPayload.transaction_number,
      tx,
    );
    expect(mockedPaymentRepo.createSalesPayment).not.toHaveBeenCalled();
  });

  it("getEditReceivablesByInvoice returns null when no invoice is found", async () => {
    mockedPaymentRepo.getEditReceivablesByInvoice.mockResolvedValueOnce(
      null as never,
    );

    await expect(
      salesPaymentService.getEditReceivablesByInvoice("SJ-404"),
    ).resolves.toBeNull();
  });

  it("getEditReceivablesByInvoice formats payment_date to YYYY-MM-DD", async () => {
    mockedPaymentRepo.getEditReceivablesByInvoice.mockResolvedValueOnce({
      invoice: {
        invoice_number: "SJ-1",
        invoice_value: 80000,
        paid_amount: 20000,
        balance_due: 60000,
      },
      payments: [
        {
          id: 1,
          transaction_number: "TRX-1",
          payment_date: new Date("2026-04-14T08:00:00.000Z"),
          paid_amount: 12000,
        },
      ],
    } as never);

    const result =
      await salesPaymentService.getEditReceivablesByInvoice("SJ-1");

    expect(result).toEqual({
      invoice_number: "SJ-1",
      invoice_value: 80000,
      paid_amount: 20000,
      balance_due: 60000,
      payments: [
        {
          id: 1,
          transaction_number: "TRX-1",
          payment_date: "2026-04-14",
          paid_amount: 12000,
        },
      ],
    });
  });

  it("deleteEditReceivablesByInvoice throws AppError when invoice does not exist", async () => {
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([]);

    await expect(
      salesPaymentService.deleteEditReceivablesByInvoice({
        invoice_number: "SJ-X",
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Invoice not found",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("deleteEditReceivablesByInvoice only deletes rows when old total paid is zero", async () => {
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([order(1, 2, 90000)]);
    mockedPaymentRepo.getBySalesOrderId.mockResolvedValueOnce([] as never);

    const result = await salesPaymentService.deleteEditReceivablesByInvoice({
      invoice_number: "SJ-1",
    });

    expect(mockedPaymentRepo.deleteBySalesOrderId).toHaveBeenCalledWith(1, tx);
    expect(mockedOrderRepo.updatePaidAndBalanceDue).not.toHaveBeenCalled();
    expect(mockedClientRepo.incReceivableBalance).not.toHaveBeenCalled();
    expect(result).toEqual({ message: "Payments deleted successfully" });
  });

  it("deleteEditReceivablesByInvoice restores order/client balances when payments existed", async () => {
    mockedOrderRepo.getOrdersForUpdate.mockImplementationOnce(async () => {
      expect(tx.execute).toHaveBeenCalledTimes(1);
      return [order(99, 3, 15000, 30000)];
    });
    mockedPaymentRepo.getBySalesOrderId.mockResolvedValueOnce([
      { id: 1, paid_amount: 20000 },
      { id: 2, paid_amount: 25000 },
    ]);

    await salesPaymentService.deleteEditReceivablesByInvoice({
      invoice_number: "SJ-99",
    });

    expect(mockedOrderRepo.getOrdersForUpdate).toHaveBeenCalledWith(
      { invoiceNumbers: ["SJ-99"] },
      tx,
    );
    expect(mockedOrderRepo.getOrdersForUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mockedPaymentRepo.getBySalesOrderId.mock.invocationCallOrder[0],
    );

    expect(mockedOrderRepo.updatePaidAndBalanceDue).toHaveBeenCalledWith(
      99,
      {
        paid_amount: 0,
        balance_due: 60000,
      },
      tx,
    );
    expect(mockedClientRepo.incReceivableBalance).toHaveBeenCalledWith(
      3,
      45000,
      tx,
    );
  });

  it("updateEditReceivablesByInvoice throws when transaction does not exist", async () => {
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([] as never);

    await expect(
      salesPaymentService.updateEditReceivablesByInvoice({
        transaction_number: "TRX-X",
        payments: [],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Transaksi tidak ditemukan",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("allows the exact pre-reversal balance plus both old payments and adjusts receivable by the delta", async () => {
    const payment = {
      client_id: 2,
      sales_order_id: 5,
      payment_date: new Date("2026-04-14"),
    };
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { ...payment, id: 10, paid_amount: 5000 },
      { ...payment, id: 11, paid_amount: 10000 },
    ]);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([order(5, 2, 15000)]);

    const result = await salesPaymentService.updateEditReceivablesByInvoice({
      transaction_number: "TRX-N1",
      payments: [
        {
          invoice_number: "SJ-5",
          payment_date: "2026-04-14",
          paid_amount: 30000,
        },
      ],
    });

    expect(mockedPaymentRepo.deleteByTransactionNumber).toHaveBeenCalledWith("TRX-N1", tx);
    expect(mockedClientRepo.decReceivableBalance).toHaveBeenCalledWith(
      2,
      15000,
      tx,
    );
    expect(result).toEqual({ message: "Payments updated successfully" });
  });

  it("updateEditReceivablesByInvoice increases receivable on negative delta", async () => {
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { id: 1, client_id: 4, sales_order_id: 6, paid_amount: 50000, payment_date: new Date() },
    ] as never);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([order(6, 4, 0)]);

    await salesPaymentService.updateEditReceivablesByInvoice({
      transaction_number: "TRX-LOW",
      payments: [
        {
          invoice_number: "SJ-6",
          payment_date: "2026-04-15",
          paid_amount: 30000,
        },
      ],
    });

    expect(mockedClientRepo.incReceivableBalance).toHaveBeenCalledWith(
      4,
      20000,
      tx,
    );
    expect(mockedClientRepo.decReceivableBalance).not.toHaveBeenCalled();
  });

  it("updateEditReceivablesByInvoice does not mutate client balance when delta is zero", async () => {
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { id: 1, client_id: 8, sales_order_id: 7, paid_amount: 35000, payment_date: new Date() },
    ] as never);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([order(7, 8, 0)]);

    await salesPaymentService.updateEditReceivablesByInvoice({
      transaction_number: "TRX-SAME",
      payments: [
        {
          invoice_number: "SJ-7",
          payment_date: "2026-04-15",
          paid_amount: 35000,
        },
      ],
    });

    expect(mockedClientRepo.incReceivableBalance).not.toHaveBeenCalled();
    expect(mockedClientRepo.decReceivableBalance).not.toHaveBeenCalled();
  });

  it.each([
    { reason: "duplicate payments exceed the balance", paid: 25001, otherClientId: 2, message: /melebihi saldo/ },
    { reason: "new invoice belongs to another client", paid: 25000, otherClientId: 3, message: /bukan milik/ },
  ])("rejects an edit when $reason before reversing old payments", async ({ paid, otherClientId, message }) => {
    const date = new Date("2026-04-14");
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { id: 1, client_id: 2, sales_order_id: 5, paid_amount: 10000, payment_date: date },
      { id: 2, client_id: 2, sales_order_id: 5, paid_amount: 15000, payment_date: date },
      { id: 3, client_id: 2, sales_order_id: 6, paid_amount: 5000, payment_date: date },
    ]);
    mockedOrderRepo.getOrdersForUpdate.mockResolvedValueOnce([
      order(5, 2, 15000),
      order(6, 2, 0),
      order(7, otherClientId, 5000),
    ]);

    await expect(
      salesPaymentService.updateEditReceivablesByInvoice({
        transaction_number: "TRX-EDIT",
        payments: [
          { invoice_number: "SJ-5", paid_amount: 15000 },
          { invoice_number: "SJ-5", paid_amount: paid },
          { invoice_number: "SJ-7", paid_amount: 5000 },
        ],
      }),
    ).rejects.toThrow(message);
    expect(tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
      mockedPaymentRepo.getByTransactionNumber.mock.invocationCallOrder[0],
    );
    expect(mockedOrderRepo.getOrdersForUpdate).toHaveBeenCalledTimes(1);
    expect(mockedOrderRepo.getOrdersForUpdate).toHaveBeenCalledWith(
      { ids: [5, 6], invoiceNumbers: ["SJ-5", "SJ-7"] },
      tx,
    );
    expect(mockedOrderRepo.bulkDecPaidAmountAndIncBalanceDue).not.toHaveBeenCalled();
    expect(mockedPaymentRepo.deleteByTransactionNumber).not.toHaveBeenCalled();
    expect(mockedPaymentRepo.insertTransactionPayments).not.toHaveBeenCalled();
  });

  it("does not delete another transaction when the requested payment ID disappeared", async () => {
    mockedPaymentRepo.getById.mockResolvedValueOnce(undefined as never);
    await expect(salesPaymentService.deletePaymentTransaction(51)).rejects.toThrow(
      "Payment transaction not found",
    );
    expect(tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
      mockedPaymentRepo.getById.mock.invocationCallOrder[0],
    );
    expect(mockedPaymentRepo.getById).toHaveBeenCalledWith(51, tx);
    expect(mockedPaymentRepo.getByTransactionNumber).not.toHaveBeenCalled();
    expect(mockedPaymentRepo.deleteByTransactionNumber).not.toHaveBeenCalled();
  });
});
