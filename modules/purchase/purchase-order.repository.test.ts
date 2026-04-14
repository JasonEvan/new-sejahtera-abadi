import db from "@/lib/drizzle";
import { purchaseOrderRepository } from "./purchase-order.repository";

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

describe("purchaseOrderRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("insertPurchaseOrder maps payload and returns inserted id", async () => {
    const returning = jest.fn().mockResolvedValue([{ id: 77 }]);
    const values = jest.fn().mockReturnValue({ returning });
    mockedDb.insert.mockReturnValue({ values });

    const payload = {
      invoice_number: "PB-1",
      invoice_date: "2026-04-14",
      total: 120000,
      discount: 5000,
      client_id: 3,
      cart: [],
    };

    const result = await purchaseOrderRepository.insertPurchaseOrder(
      payload as never,
    );

    expect(mockedDb.insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice_number: "PB-1",
        invoice_value: 120000,
        invoice_discount: 5000,
        payment_discount: 0,
        paid_amount: 0,
        balance_due: 120000,
        client_id: 3,
      }),
    );
    expect(values.mock.calls[0][0].invoice_date).toBeInstanceOf(Date);
    expect(returning).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 77 }]);
  });

  it("bulkIncPaidAmountAndDecBalanceDue returns early for empty items", () => {
    const result = purchaseOrderRepository.bulkIncPaidAmountAndDecBalanceDue(
      [],
    );
    expect(result).toBeUndefined();
    expect(mockedDb.execute).not.toHaveBeenCalled();
  });

  it("getLatestPurchasedItemsByClient returns [] for blank prefix", async () => {
    const result =
      await purchaseOrderRepository.getLatestPurchasedItemsByClient(1, "   ");

    expect(result).toEqual([]);
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it("getLatestPurchasedItemsByClient keeps latest row per stock name and serializes date", async () => {
    const where = jest.fn().mockReturnValue({
      orderBy: jest.fn().mockResolvedValue([
        {
          name: "Cable",
          price: 100,
          bought_at: new Date("2026-04-14T00:00:00.000Z"),
        },
        {
          name: "Cable",
          price: 90,
          bought_at: new Date("2026-04-10T00:00:00.000Z"),
        },
        {
          name: "Screw",
          price: 10,
          bought_at: new Date("2026-04-12T00:00:00.000Z"),
        },
      ]),
    });

    const innerJoin2 = jest.fn().mockReturnValue({ where });
    const innerJoin1 = jest.fn().mockReturnValue({ innerJoin: innerJoin2 });
    const from = jest.fn().mockReturnValue({ innerJoin: innerJoin1 });
    mockedDb.select.mockReturnValue({ from });

    const result =
      await purchaseOrderRepository.getLatestPurchasedItemsByClient(2, "Ca");

    expect(result).toEqual([
      {
        name: "Cable",
        price: 100,
        bought_at: "2026-04-14T00:00:00.000Z",
      },
      {
        name: "Screw",
        price: 10,
        bought_at: "2026-04-12T00:00:00.000Z",
      },
    ]);
  });

  it("getDiscountById throws when order is not found", async () => {
    const where = jest.fn().mockResolvedValue([]);
    const from = jest.fn().mockReturnValue({ where });
    mockedDb.select.mockReturnValue({ from });

    await expect(purchaseOrderRepository.getDiscountById(999)).rejects.toThrow(
      "Purchase order 999 not found",
    );
  });

  it("getInvoiceValueById returns invoice value when found", async () => {
    const where = jest.fn().mockResolvedValue([{ invoice_value: 555 }]);
    const from = jest.fn().mockReturnValue({ where });
    mockedDb.select.mockReturnValue({ from });

    await expect(purchaseOrderRepository.getInvoiceValueById(10)).resolves.toBe(
      555,
    );
  });
});
