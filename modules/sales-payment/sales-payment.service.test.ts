import db from "@/lib/drizzle";
import { AppError } from "@/lib/errors";
import { clientRepository } from "../client/client.repository";
import { saleOrderRepository } from "../sale/sale-order.repository";
import { salesPaymentRepository } from "./sales-payment.repository";
import { salesPaymentService } from "./sales-payment.service";

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
    getByInvoiceNumber: jest.fn(),
    getByInvoiceNumbers: jest.fn(),
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
  const tx = {};

  const createPayload = {
    client_id: 7,
    transaction_number: "TRX-SP-1",
    transaction_date: "2026-04-14",
    cart: [
      { sales_order_id: 10, paid_amount: 20000 },
      { sales_order_id: 11, paid_amount: 30000 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation(
      async (cb: (txArg: unknown) => unknown) => cb(tx),
    );
  });

  it("createSalesPayment executes write flow and decrements receivable by cart total", async () => {
    await salesPaymentService.createSalesPayment(createPayload as never);

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
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce(
      undefined as never,
    );

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
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 1,
      client_id: 2,
      paid_amount: 0,
      balance_due: 90000,
    } as never);
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
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 99,
      client_id: 3,
      paid_amount: 30000,
      balance_due: 15000,
    } as never);
    mockedPaymentRepo.getBySalesOrderId.mockResolvedValueOnce([
      { id: 1, paid_amount: 20000 },
      { id: 2, paid_amount: 25000 },
    ] as never);

    await salesPaymentService.deleteEditReceivablesByInvoice({
      invoice_number: "SJ-99",
    });

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

  it("updateEditReceivablesByInvoice updates paid/balance and decreases receivable on positive delta", async () => {
    mockedPaymentRepo.getByTransactionNumber.mockResolvedValueOnce([
      { id: 10, client_id: 2, sales_order_id: 5, paid_amount: 15000, payment_date: new Date() },
    ] as never);
    mockedOrderRepo.getByInvoiceNumbers.mockResolvedValueOnce([
      {
        id: 5,
        client_id: 2,
        invoice_number: "SJ-5",
        invoice_value: 100000,
      },
    ] as never);

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
    mockedOrderRepo.getByInvoiceNumbers.mockResolvedValueOnce([
      {
        id: 6,
        client_id: 4,
        invoice_number: "SJ-6",
        invoice_value: 90000,
      },
    ] as never);

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
    mockedOrderRepo.getByInvoiceNumbers.mockResolvedValueOnce([
      {
        id: 7,
        client_id: 8,
        invoice_number: "SJ-7",
        invoice_value: 90000,
      },
    ] as never);

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
});
