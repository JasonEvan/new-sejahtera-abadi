import db from "@/lib/drizzle";
import { purchaseReturnRepository } from "./purchase-return.repository";

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

describe("purchaseReturnRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createPurchaseReturn maps payload and returns id", async () => {
    const returning = jest.fn().mockResolvedValue([{ id: 11 }]);
    const values = jest.fn().mockReturnValue({ returning });
    mockedDb.insert.mockReturnValue({ values });

    const result = await purchaseReturnRepository.createPurchaseReturn({
      client_id: 1,
      purchase_order_id: 7,
      return_date: "2026-04-14",
      lines: [],
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 1,
        purchase_order_id: 7,
      }),
    );
    expect(values.mock.calls[0][0].return_date).toBeInstanceOf(Date);
    expect(result).toEqual([{ id: 11 }]);
  });

  it("hasReturnForPurchaseOrder returns true when row exists", async () => {
    const limit = jest.fn().mockResolvedValue([{ id: 1 }]);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    mockedDb.select.mockReturnValue({ from });

    await expect(
      purchaseReturnRepository.hasReturnForPurchaseOrder(9),
    ).resolves.toBe(true);
  });

  it("hasReturnForPurchaseOrder returns false when row is missing", async () => {
    const limit = jest.fn().mockResolvedValue([]);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    mockedDb.select.mockReturnValue({ from });

    await expect(
      purchaseReturnRepository.hasReturnForPurchaseOrder(9),
    ).resolves.toBe(false);
  });

  it("getUnpaidReturnedInvoices builds chain and returns rows", async () => {
    const orderBy = jest
      .fn()
      .mockResolvedValue([{ id: 1, invoice_number: "PB-1" }]);
    const groupBy = jest.fn().mockReturnValue({ orderBy });
    const where = jest.fn().mockReturnValue({ groupBy });
    const innerJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ innerJoin });
    mockedDb.select.mockReturnValue({ from });

    const result = await purchaseReturnRepository.getUnpaidReturnedInvoices();

    expect(result).toEqual([{ id: 1, invoice_number: "PB-1" }]);
    expect(orderBy).toHaveBeenCalledTimes(1);
  });

  it("getEditPurchaseReturnDetailById returns null when header is missing", async () => {
    const limit = jest.fn().mockResolvedValue([]);
    const where = jest.fn().mockReturnValue({ limit });
    const innerJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ innerJoin });
    mockedDb.select.mockReturnValueOnce({ from });

    const result =
      await purchaseReturnRepository.getEditPurchaseReturnDetailById(404);

    expect(result).toBeNull();
    expect(mockedDb.select).toHaveBeenCalledTimes(1);
  });

  it("getEditPurchaseReturnDetailById maps header, lines and meta", async () => {
    const groupBy = jest.fn().mockResolvedValue([
      {
        id: 5,
        stock_id: 2,
        name: "Pipe",
        price: 7000,
        qty: 6,
        return_qty: 2,
      },
      {
        id: 6,
        stock_id: null,
        name: null,
        price: 5000,
        qty: 1,
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
        purchase_return_id: 12,
        purchase_order_id: 90,
        client: 8,
        invoice_number: "PB-90",
        return_date: new Date("2026-04-14T00:00:00.000Z"),
        discount: 10,
        total: 40000,
      },
    ]);
    const where1 = jest.fn().mockReturnValue({ limit });
    const innerJoin = jest.fn().mockReturnValue({ where: where1 });
    const from1 = jest.fn().mockReturnValue({ innerJoin });

    mockedDb.select
      .mockReturnValueOnce({ from: from1 })
      .mockReturnValueOnce({ from: from2 });

    const result =
      await purchaseReturnRepository.getEditPurchaseReturnDetailById(90);

    expect(result).toEqual({
      transaction_information: {
        purchase_return_id: 12,
        purchase_order_id: 90,
        client: 8,
        invoice_number: "PB-90",
        return_date: "2026-04-14T00:00:00.000Z",
      },
      lines: [
        {
          id: 5,
          stock_id: 2,
          name: "Pipe",
          price: 7000,
          original_qty: 8,
          qty: 6,
          return_qty: 2,
          subtotal: 42000,
        },
        {
          id: 6,
          stock_id: 0,
          name: "",
          price: 5000,
          original_qty: 1,
          qty: 1,
          return_qty: 0,
          subtotal: 5000,
        },
      ],
      meta: {
        invoice_value: 61000,
        discount: 10,
        total: 40000,
      },
    });
  });
});
