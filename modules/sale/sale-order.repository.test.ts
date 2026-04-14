import db from "@/lib/drizzle";
import { saleOrderRepository } from "./sale-order.repository";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    insert: jest.fn(),
    select: jest.fn(),
    execute: jest.fn(),
  },
}));

const mockedDb = db as unknown as {
  insert: jest.Mock;
  select: jest.Mock;
  execute: jest.Mock;
};

describe("saleOrderRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("insertSaleOrder maps payload and returns inserted id", async () => {
    const returning = jest.fn().mockResolvedValue([{ id: 55 }]);
    const values = jest.fn().mockReturnValue({ returning });
    mockedDb.insert.mockReturnValue({ values });

    const payload = {
      client_id: 8,
      invoice_number: "SJ-1",
      invoice_date: "2026-04-14",
      total: 200000,
      discount: 10000,
      cart: [],
    };

    const result = await saleOrderRepository.insertSaleOrder(payload as never);

    expect(mockedDb.insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 8,
        invoice_number: "SJ-1",
        invoice_value: 200000,
        invoice_discount: 10000,
        payment_discount: 0,
        paid_amount: 0,
        balance_due: 200000,
      }),
    );
    expect(values.mock.calls[0][0].invoice_date).toBeInstanceOf(Date);
    expect(result).toEqual([{ id: 55 }]);
  });

  it("bulkIncPaidAmountAndDecBalanceDue returns early for empty items", () => {
    const result = saleOrderRepository.bulkIncPaidAmountAndDecBalanceDue([]);
    expect(result).toBeUndefined();
    expect(mockedDb.execute).not.toHaveBeenCalled();
  });

  it("getLatestSoldItemsByClient returns [] for blank prefix", async () => {
    const result = await saleOrderRepository.getLatestSoldItemsByClient(
      1,
      "   ",
    );

    expect(result).toEqual([]);
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it("getLatestSoldItemsByClient keeps latest row per stock name and serializes date", async () => {
    const where = jest.fn().mockReturnValue({
      orderBy: jest.fn().mockResolvedValue([
        {
          name: "Cable",
          price: 130,
          sold_at: new Date("2026-04-14T00:00:00.000Z"),
        },
        {
          name: "Cable",
          price: 120,
          sold_at: new Date("2026-04-13T00:00:00.000Z"),
        },
        {
          name: "Pipe",
          price: 80,
          sold_at: new Date("2026-04-11T00:00:00.000Z"),
        },
      ]),
    });

    const innerJoin2 = jest.fn().mockReturnValue({ where });
    const innerJoin1 = jest.fn().mockReturnValue({ innerJoin: innerJoin2 });
    const from = jest.fn().mockReturnValue({ innerJoin: innerJoin1 });
    mockedDb.select.mockReturnValue({ from });

    const result = await saleOrderRepository.getLatestSoldItemsByClient(
      2,
      "Ca",
    );

    expect(result).toEqual([
      {
        name: "Cable",
        price: 130,
        sold_at: "2026-04-14T00:00:00.000Z",
      },
      {
        name: "Pipe",
        price: 80,
        sold_at: "2026-04-11T00:00:00.000Z",
      },
    ]);
  });

  it("getDiscountById throws when order is not found", async () => {
    const where = jest.fn().mockResolvedValue([]);
    const from = jest.fn().mockReturnValue({ where });
    mockedDb.select.mockReturnValue({ from });

    await expect(saleOrderRepository.getDiscountById(404)).rejects.toThrow(
      "Sales order 404 not found",
    );
  });

  it("getInvoiceValueById returns invoice value when found", async () => {
    const where = jest.fn().mockResolvedValue([{ invoice_value: 777 }]);
    const from = jest.fn().mockReturnValue({ where });
    mockedDb.select.mockReturnValue({ from });

    await expect(saleOrderRepository.getInvoiceValueById(5)).resolves.toBe(777);
  });
});
