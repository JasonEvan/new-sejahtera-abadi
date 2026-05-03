import db from "@/lib/drizzle";
import { salesReturnRepository } from "./sales-return.repository";

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

describe("salesReturnRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createSalesReturn maps payload and returns id", async () => {
    const returning = jest.fn().mockResolvedValue([{ id: 10 }]);
    const values = jest.fn().mockReturnValue({ returning });
    mockedDb.insert.mockReturnValue({ values });

    const result = await salesReturnRepository.createSalesReturn({
      client_id: 1,
      sales_order_id: 7,
      return_date: "2026-04-14",
      lines: [],
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 1,
        sales_order_id: 7,
      }),
    );
    expect(values.mock.calls[0][0].return_date).toBeInstanceOf(Date);
    expect(result).toEqual([{ id: 10 }]);
  });

  it("hasReturnForSalesOrder returns true when row exists", async () => {
    const limit = jest.fn().mockResolvedValue([{ id: 1 }]);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    mockedDb.select.mockReturnValue({ from });

    await expect(salesReturnRepository.hasReturnForSalesOrder(9)).resolves.toBe(
      true,
    );
  });

  it("hasReturnForSalesOrder returns false when row is missing", async () => {
    const limit = jest.fn().mockResolvedValue([]);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    mockedDb.select.mockReturnValue({ from });

    await expect(salesReturnRepository.hasReturnForSalesOrder(9)).resolves.toBe(
      false,
    );
  });

  it("getUnpaidReturnedInvoices builds chain and returns rows", async () => {
    const orderBy = jest
      .fn()
      .mockResolvedValue([{ id: 1, invoice_number: "SJ-1" }]);
    const groupBy = jest.fn().mockReturnValue({ orderBy });
    const where = jest.fn().mockReturnValue({ groupBy });
    const innerJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ innerJoin });
    mockedDb.select.mockReturnValue({ from });

    const result = await salesReturnRepository.getUnpaidReturnedInvoices();

    expect(result).toEqual([{ id: 1, invoice_number: "SJ-1" }]);
    expect(orderBy).toHaveBeenCalledTimes(1);
  });

  it("getEditSaleReturnDetailById returns null when header is missing", async () => {
    const limit = jest.fn().mockResolvedValue([]);
    const where = jest.fn().mockReturnValue({ limit });
    const innerJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ innerJoin });
    mockedDb.select.mockReturnValueOnce({ from });

    const result =
      await salesReturnRepository.getEditSaleReturnDetailById(404);

    expect(result).toBeNull();
    expect(mockedDb.select).toHaveBeenCalledTimes(1);
  });

  it("getEditSaleReturnDetailById maps header, lines and meta", async () => {
    const groupBy = jest.fn().mockResolvedValue([
      {
        id: 5,
        stock_id: 2,
        name: "Cable",
        price: 10000,
        qty: 3,
        return_qty: 1,
      },
      {
        id: 6,
        stock_id: null,
        name: null,
        price: 5000,
        qty: 2,
        return_qty: 0,
      },
    ]);
    const where2 = jest.fn().mockReturnValue({ groupBy });
    const leftJoin3 = jest.fn().mockReturnValue({ where: where2 });
    const leftJoin2 = jest.fn().mockReturnValue({ leftJoin: leftJoin3 });
    const leftJoin1 = jest.fn().mockReturnValue({ leftJoin: leftJoin2 });
    const from2 = jest.fn().mockReturnValue({ leftJoin: leftJoin1 });

    const limit = jest.fn().mockResolvedValue([
      {
        sales_return_id: 10,
        sales_order_id: 77,
        client: 3,
        invoice_number: "SJ-77",
        return_date: new Date("2026-04-14T00:00:00.000Z"),
        discount: 5,
        total: 42000,
      },
    ]);
    const where1 = jest.fn().mockReturnValue({ limit });
    const innerJoin = jest.fn().mockReturnValue({ where: where1 });
    const from1 = jest.fn().mockReturnValue({ innerJoin });

    mockedDb.select
      .mockReturnValueOnce({ from: from1 })
      .mockReturnValueOnce({ from: from2 });

    const result =
      await salesReturnRepository.getEditSaleReturnDetailById(77);

    expect(result).toEqual({
      transaction_information: {
        sales_return_id: 10,
        sales_order_id: 77,
        client: 3,
        invoice_number: "SJ-77",
        return_date: "2026-04-14T00:00:00.000Z",
      },
      lines: [
        {
          id: 5,
          stock_id: 2,
          name: "Cable",
          price: 10000,
          original_qty: 4,
          qty: 3,
          return_qty: 1,
          subtotal: 30000,
        },
        {
          id: 6,
          stock_id: 0,
          name: "",
          price: 5000,
          original_qty: 2,
          qty: 2,
          return_qty: 0,
          subtotal: 10000,
        },
      ],
      meta: {
        invoice_value: 50000,
        discount: 5,
        total: 42000,
      },
    });
  });
});
