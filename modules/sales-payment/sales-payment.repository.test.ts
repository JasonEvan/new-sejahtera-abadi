import db from "@/lib/drizzle";
import { salesPaymentRepository } from "./sales-payment.repository";

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

describe("salesPaymentRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createSalesPayment maps cart rows and converts payment_date to Date", () => {
    const values = jest.fn().mockResolvedValue({});
    mockedDb.insert.mockReturnValue({ values });

    const payload = {
      client_id: 2,
      transaction_number: "TRX-SP-1",
      transaction_date: "2026-04-14",
      cart: [
        { sales_order_id: 10, paid_amount: 10000 },
        { sales_order_id: 11, paid_amount: 30000 },
      ],
    };

    salesPaymentRepository.createSalesPayment(payload as never);

    expect(mockedDb.insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledTimes(1);
    expect(values.mock.calls[0][0]).toHaveLength(2);
    expect(values.mock.calls[0][0][0]).toEqual(
      expect.objectContaining({
        client_id: 2,
        transaction_number: "TRX-SP-1",
        sales_order_id: 10,
        paid_amount: 10000,
      }),
    );
    expect(values.mock.calls[0][0][0].payment_date).toBeInstanceOf(Date);
  });

  it("getEditReceivablesByInvoice returns null when invoice not found", async () => {
    const whereInvoice = jest.fn().mockResolvedValue([]);
    const fromInvoice = jest.fn().mockReturnValue({ where: whereInvoice });
    mockedDb.select.mockReturnValueOnce({ from: fromInvoice });

    const result =
      await salesPaymentRepository.getEditReceivablesByInvoice("SJ-404");

    expect(result).toBeNull();
    expect(mockedDb.select).toHaveBeenCalledTimes(1);
  });

  it("getEditReceivablesByInvoice returns invoice with ordered payments", async () => {
    const orderBy = jest.fn().mockResolvedValue([
      {
        id: 1,
        transaction_number: "TRX-1",
        payment_date: new Date("2026-04-14T00:00:00.000Z"),
        paid_amount: 12000,
      },
    ]);
    const wherePayment = jest.fn().mockReturnValue({ orderBy });
    const fromPayment = jest.fn().mockReturnValue({ where: wherePayment });

    const whereInvoice = jest.fn().mockResolvedValue([
      {
        id: 77,
        invoice_number: "SJ-77",
        invoice_value: 50000,
        paid_amount: 12000,
        balance_due: 38000,
      },
    ]);
    const fromInvoice = jest.fn().mockReturnValue({ where: whereInvoice });

    mockedDb.select
      .mockReturnValueOnce({ from: fromInvoice })
      .mockReturnValueOnce({ from: fromPayment });

    const result =
      await salesPaymentRepository.getEditReceivablesByInvoice("SJ-77");

    expect(result).toEqual({
      invoice: {
        id: 77,
        invoice_number: "SJ-77",
        invoice_value: 50000,
        paid_amount: 12000,
        balance_due: 38000,
      },
      payments: [
        {
          id: 1,
          transaction_number: "TRX-1",
          payment_date: new Date("2026-04-14T00:00:00.000Z"),
          paid_amount: 12000,
        },
      ],
    });
    expect(orderBy).toHaveBeenCalledTimes(1);
  });

  it("getBySalesOrderId uses transaction db when provided", () => {
    const where = jest.fn().mockResolvedValue([{ id: 1, paid_amount: 9000 }]);
    const from = jest.fn().mockReturnValue({ where });
    const tx = {
      select: jest.fn().mockReturnValue({ from }),
    };

    salesPaymentRepository.getBySalesOrderId(5, tx as never);

    expect(tx.select).toHaveBeenCalledTimes(1);
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it("deleteBySalesOrderId uses transaction db when provided", () => {
    const where = jest.fn().mockResolvedValue({});
    const tx = {
      delete: jest.fn().mockReturnValue({ where }),
    };

    salesPaymentRepository.deleteBySalesOrderId(9, tx as never);

    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(mockedDb.delete).not.toHaveBeenCalled();
  });

  it("insertEditReceivablesPaymentRows maps rows and converts payment_date to Date", () => {
    const values = jest.fn().mockResolvedValue({});
    mockedDb.insert.mockReturnValue({ values });

    salesPaymentRepository.insertEditReceivablesPaymentRows({
      client_id: 1,
      sales_order_id: 7,
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
        sales_order_id: 7,
        transaction_number: "TRX-9",
        paid_amount: 22000,
      }),
    ]);
    expect(values.mock.calls[0][0][0].payment_date).toBeInstanceOf(Date);
  });
});
