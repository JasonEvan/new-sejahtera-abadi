import db from "@/lib/drizzle";
import { purchasePaymentRepository } from "./purchase-payment.repository";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    insert: jest.fn(),
    select: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedDb = db as unknown as {
  insert: jest.Mock;
  select: jest.Mock;
  delete: jest.Mock;
};

describe("purchasePaymentRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createPurchasePayment maps cart rows and converts payment_date to Date", () => {
    const values = jest.fn().mockResolvedValue({});
    mockedDb.insert.mockReturnValue({ values });

    const payload = {
      client_id: 4,
      transaction_number: "TRX-PP-1",
      transaction_date: "2026-04-14",
      cart: [
        { purchase_order_id: 20, paid_amount: 9000 },
        { purchase_order_id: 21, paid_amount: 11000 },
      ],
    };

    purchasePaymentRepository.createPurchasePayment(payload as never);

    expect(mockedDb.insert).toHaveBeenCalledTimes(1);
    expect(values.mock.calls[0][0]).toHaveLength(2);
    expect(values.mock.calls[0][0][1]).toEqual(
      expect.objectContaining({
        client_id: 4,
        transaction_number: "TRX-PP-1",
        purchase_order_id: 21,
        paid_amount: 11000,
      }),
    );
    expect(values.mock.calls[0][0][0].payment_date).toBeInstanceOf(Date);
  });

  it("getEditPayablesByInvoice returns null when invoice not found", async () => {
    const whereInvoice = jest.fn().mockResolvedValue([]);
    const fromInvoice = jest.fn().mockReturnValue({ where: whereInvoice });
    mockedDb.select.mockReturnValueOnce({ from: fromInvoice });

    const result =
      await purchasePaymentRepository.getEditPayablesByInvoice("PB-404");

    expect(result).toBeNull();
    expect(mockedDb.select).toHaveBeenCalledTimes(1);
  });

  it("getEditPayablesByInvoice returns invoice with ordered payments", async () => {
    const orderBy = jest.fn().mockResolvedValue([
      {
        id: 2,
        transaction_number: "TRX-2",
        payment_date: new Date("2026-04-14T00:00:00.000Z"),
        paid_amount: 30000,
      },
    ]);
    const wherePayment = jest.fn().mockReturnValue({ orderBy });
    const fromPayment = jest.fn().mockReturnValue({ where: wherePayment });

    const whereInvoice = jest.fn().mockResolvedValue([
      {
        id: 88,
        invoice_number: "PB-88",
        invoice_value: 100000,
        paid_amount: 30000,
        balance_due: 70000,
      },
    ]);
    const fromInvoice = jest.fn().mockReturnValue({ where: whereInvoice });

    mockedDb.select
      .mockReturnValueOnce({ from: fromInvoice })
      .mockReturnValueOnce({ from: fromPayment });

    const result =
      await purchasePaymentRepository.getEditPayablesByInvoice("PB-88");

    expect(result).toEqual({
      invoice: {
        id: 88,
        invoice_number: "PB-88",
        invoice_value: 100000,
        paid_amount: 30000,
        balance_due: 70000,
      },
      payments: [
        {
          id: 2,
          transaction_number: "TRX-2",
          payment_date: new Date("2026-04-14T00:00:00.000Z"),
          paid_amount: 30000,
        },
      ],
    });
    expect(orderBy).toHaveBeenCalledTimes(1);
  });

  it("getByPurchaseOrderId uses transaction db when provided", () => {
    const where = jest.fn().mockResolvedValue([{ id: 1, paid_amount: 1000 }]);
    const from = jest.fn().mockReturnValue({ where });
    const tx = {
      select: jest.fn().mockReturnValue({ from }),
    };

    purchasePaymentRepository.getByPurchaseOrderId(5, tx as never);

    expect(tx.select).toHaveBeenCalledTimes(1);
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it("deleteByPurchaseOrderId uses transaction db when provided", () => {
    const where = jest.fn().mockResolvedValue({});
    const tx = {
      delete: jest.fn().mockReturnValue({ where }),
    };

    purchasePaymentRepository.deleteByPurchaseOrderId(9, tx as never);

    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(mockedDb.delete).not.toHaveBeenCalled();
  });

  it("insertEditPayablesPaymentRows maps rows and converts payment_date to Date", () => {
    const values = jest.fn().mockResolvedValue({});
    mockedDb.insert.mockReturnValue({ values });

    purchasePaymentRepository.insertEditPayablesPaymentRows({
      client_id: 1,
      purchase_order_id: 7,
      payments: [
        {
          transaction_number: "TRX-9",
          payment_date: "2026-04-15",
          paid_amount: 22000,
        },
      ],
    });

    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({
        client_id: 1,
        purchase_order_id: 7,
        transaction_number: "TRX-9",
        paid_amount: 22000,
      }),
    ]);
    expect(values.mock.calls[0][0][0].payment_date).toBeInstanceOf(Date);
  });
});
