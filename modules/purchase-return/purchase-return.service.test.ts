import db from "@/lib/drizzle";
import { AppError } from "@/lib/errors";
import { clientRepository } from "../client/client.repository";
import { purchaseOrderLineRepository } from "../purchase/purchase-order-line.repository";
import { purchaseOrderRepository } from "../purchase/purchase-order.repository";
import { stockRepository } from "../stock/stock.repository";
import { purchaseReturnLineRepository } from "./purchase-return-line.repository";
import { purchaseReturnRepository } from "./purchase-return.repository";
import { purchaseReturnService } from "./purchase-return.service";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

jest.mock("./purchase-return.repository", () => ({
  purchaseReturnRepository: {
    createPurchaseReturn: jest.fn(),
    getUnpaidReturnedInvoices: jest.fn(),
    getEditPurchaseReturnDetailById: jest.fn(),
    getById: jest.fn(),
    deleteById: jest.fn(),
    getReturnHistoryByPurchaseOrderId: jest.fn(),
  },
}));

jest.mock("./purchase-return-line.repository", () => ({
  purchaseReturnLineRepository: {
    createPurchaseReturnLine: jest.fn(),
    getByPurchaseReturnIds: jest.fn(),
    deleteByPurchaseReturnIds: jest.fn(),
  },
}));

jest.mock("../purchase/purchase-order-line.repository", () => ({
  purchaseOrderLineRepository: {
    bulkDecrementQuantity: jest.fn(),
    bulkIncrementQuantity: jest.fn(),
    getSumTotalPriceByOrderId: jest.fn(),
    getByPurchaseOrderId: jest.fn(),
  },
}));

jest.mock("../stock/stock.repository", () => ({
  stockRepository: {
    getStocksForUpdate: jest.fn(),
    bulkDecrementStockAndIncrementQtyOut: jest.fn(),
    bulkIncrementStockAndDecrementQtyOut: jest.fn(),
  },
}));

jest.mock("../purchase/purchase-order.repository", () => ({
  purchaseOrderRepository: {
    getDiscountById: jest.fn(),
    updateInvoiceValue: jest.fn(),
    getById: jest.fn(),
  },
}));

jest.mock("../client/client.repository", () => ({
  clientRepository: {
    incPayableBalance: jest.fn(),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;
const mockedTransaction = mockedDb.transaction as unknown as jest.Mock;
const mockedReturnRepo = purchaseReturnRepository as jest.Mocked<
  typeof purchaseReturnRepository
>;
const mockedReturnLineRepo = purchaseReturnLineRepository as jest.Mocked<
  typeof purchaseReturnLineRepository
>;
const mockedOrderLineRepo = purchaseOrderLineRepository as jest.Mocked<
  typeof purchaseOrderLineRepository
>;
const mockedStockRepo = stockRepository as jest.Mocked<typeof stockRepository>;
const mockedOrderRepo = purchaseOrderRepository as jest.Mocked<
  typeof purchaseOrderRepository
>;
const mockedClientRepo = clientRepository as jest.Mocked<
  typeof clientRepository
>;

describe("purchase-return.service", () => {
  const tx = {};

  const createPayload = {
    client_id: 1,
    purchase_order_id: 30,
    return_date: "2026-04-14",
    lines: [{ purchase_order_line_id: 7, return_qty: 2 }],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockedTransaction.mockImplementation(
      async (cb: (txArg: unknown) => unknown) => cb(tx),
    );
    mockedOrderRepo.getById.mockResolvedValue({
      id: 30,
      client_id: 1,
      paid_amount: 0,
      invoice_value: 130000,
    });
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValue([
      { id: 7, stock_id: 3, price: 12000, qty: 3 },
    ]);
    mockedStockRepo.getStocksForUpdate.mockResolvedValue([
      { id: 3, ending_stock: 3 },
    ]);
  });

  it("createPurchaseReturn throws when insert result is empty", async () => {
    mockedReturnRepo.createPurchaseReturn.mockResolvedValueOnce([] as never);

    await expect(
      purchaseReturnService.createPurchaseReturn(createPayload),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Failed to create purchase return",
        statusCode: 500,
      }) as AppError,
    );
  });

  it("createPurchaseReturn rejects a line outside the invoice without writing", async () => {
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([]);

    await expect(
      purchaseReturnService.createPurchaseReturn(createPayload),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Order line 7 does not belong to selected invoice",
        statusCode: 400,
      }) as AppError,
    );
    expect(mockedReturnRepo.createPurchaseReturn).not.toHaveBeenCalled();
  });

  it.each([
    { client_id: 2, paid_amount: 0 },
    { client_id: 1, paid_amount: 1 },
  ])("createPurchaseReturn rejects an ineligible invoice: %j", async (invoice) => {
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 30,
      invoice_value: 130000,
      ...invoice,
    });

    await expect(
      purchaseReturnService.createPurchaseReturn(createPayload),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mockedReturnRepo.createPurchaseReturn).not.toHaveBeenCalled();
    expect(mockedClientRepo.incPayableBalance).not.toHaveBeenCalled();
  });

  it("createPurchaseReturn rejects duplicate line quantities above the remainder", async () => {
    await expect(
      purchaseReturnService.createPurchaseReturn({
        ...createPayload,
        lines: [...createPayload.lines, ...createPayload.lines],
      }),
    ).rejects.toMatchObject({
      message: "Jumlah retur melebihi jumlah barang pada line 7",
      statusCode: 400,
    });
    expect(mockedReturnRepo.createPurchaseReturn).not.toHaveBeenCalled();
  });

  it("createPurchaseReturn rejects insufficient stock shared by different lines", async () => {
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 7, stock_id: 3, price: 12000, qty: 3 },
      { id: 8, stock_id: 3, price: 15000, qty: 3 },
    ]);

    await expect(
      purchaseReturnService.createPurchaseReturn({
        ...createPayload,
        lines: [
          ...createPayload.lines,
          { purchase_order_line_id: 8, return_qty: 2 },
        ],
      }),
    ).rejects.toMatchObject({
      message: "Jumlah retur melebihi stok tersedia pada stok 3",
      statusCode: 400,
    });
    expect(mockedReturnRepo.createPurchaseReturn).not.toHaveBeenCalled();
    expect(
      mockedStockRepo.bulkDecrementStockAndIncrementQtyOut,
    ).not.toHaveBeenCalled();
  });

  it("createPurchaseReturn runs full create flow and updates payable delta", async () => {
    mockedReturnRepo.createPurchaseReturn.mockResolvedValueOnce([
      { id: 99 },
    ] as never);
    mockedOrderRepo.getDiscountById.mockResolvedValueOnce(10 as never);
    mockedOrderLineRepo.getSumTotalPriceByOrderId.mockResolvedValueOnce(
      100000 as never,
    );

    await purchaseReturnService.createPurchaseReturn(createPayload);

    expect(mockedReturnLineRepo.createPurchaseReturnLine).toHaveBeenCalledWith(
      [
        {
          purchase_order_line_id: 7,
          return_qty: 2,
          price: 12000,
          stock_id: 3,
        },
      ],
      99,
      tx,
    );
    expect(mockedOrderLineRepo.bulkDecrementQuantity).toHaveBeenCalledWith(
      [{ id: 7, quantity: 2 }],
      tx,
    );
    expect(
      mockedStockRepo.bulkDecrementStockAndIncrementQtyOut,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 2 }], tx);
    expect(mockedOrderRepo.updateInvoiceValue).toHaveBeenCalledWith(
      90000,
      30,
      tx,
    );
    expect(mockedClientRepo.incPayableBalance).toHaveBeenCalledWith(
      1,
      -40000,
      tx,
    );
  });

  it("creates returns for lines without a stock record without changing stock", async () => {
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 7, stock_id: null, price: 12000, qty: 2 },
    ]);
    mockedReturnRepo.createPurchaseReturn.mockResolvedValueOnce([{ id: 99 }]);
    mockedOrderRepo.getDiscountById.mockResolvedValueOnce(0);
    mockedOrderLineRepo.getSumTotalPriceByOrderId.mockResolvedValueOnce(0);

    await purchaseReturnService.createPurchaseReturn(createPayload);

    expect(mockedOrderLineRepo.bulkDecrementQuantity).toHaveBeenCalledWith(
      [{ id: 7, quantity: 2 }],
      tx,
    );
    expect(mockedStockRepo.getStocksForUpdate).not.toHaveBeenCalled();
    expect(
      mockedStockRepo.bulkDecrementStockAndIncrementQtyOut,
    ).not.toHaveBeenCalled();
  });

  it("getUnpaidReturnedInvoices proxies repository output", async () => {
    mockedReturnRepo.getUnpaidReturnedInvoices.mockResolvedValueOnce([
      { id: 1, invoice_number: "PB-1" },
    ] as never);

    await expect(
      purchaseReturnService.getUnpaidReturnedInvoices(),
    ).resolves.toEqual([{ id: 1, invoice_number: "PB-1" }]);
  });

  it("getEditPurchaseReturnDetail throws when return is missing", async () => {
    mockedReturnRepo.getEditPurchaseReturnDetailById.mockResolvedValueOnce(
      null as never,
    );

    await expect(
      purchaseReturnService.getEditPurchaseReturnDetail(404),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Data retur tidak ditemukan",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("updatePurchaseReturn throws when return is not found", async () => {
    mockedReturnRepo.getById.mockResolvedValueOnce([] as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        purchase_return_id: 10,
        return_date: "2026-04-14",
        lines: [],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Data retur pembelian tidak ditemukan",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("updatePurchaseReturn throws when invoice is not found", async () => {
    mockedReturnRepo.getById.mockResolvedValueOnce([
      { purchase_order_id: 5 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce(undefined as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        purchase_return_id: 10,
        return_date: "2026-04-14",
        lines: [],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Invoice not found",
        statusCode: 404,
      }) as AppError,
    );

    expect(mockedOrderRepo.getById).toHaveBeenCalledWith(5, tx);
  });

  it("updatePurchaseReturn throws when invoice already has payment", async () => {
    mockedReturnRepo.getById.mockResolvedValue([
      { purchase_order_id: 5, client_id: 1 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 5,
      paid_amount: 1,
    } as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        purchase_return_id: 10,
        return_date: "2026-04-14",
        lines: [],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Retur tidak bisa diedit karena nota sudah dibayar",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("updatePurchaseReturn throws when line does not belong to selected invoice", async () => {
    mockedReturnRepo.getById.mockResolvedValue([
      { purchase_order_id: 6, client_id: 1 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 6,
      client_id: 1,
      invoice_value: 50000,
      paid_amount: 0,
    } as never);
    mockedReturnLineRepo.getByPurchaseReturnIds.mockResolvedValueOnce(
      [] as never,
    );
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 100, qty: 3 },
    ] as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        purchase_return_id: 10,
        return_date: "2026-04-14",
        lines: [{ purchase_order_line_id: 101, return_qty: 1 }],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Order line 101 does not belong to selected invoice",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("rejects an edit when duplicate line quantities exceed the remainder", async () => {
    mockedReturnRepo.getById.mockResolvedValue([
      { purchase_order_id: 6, client_id: 1 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 6,
      client_id: 1,
      invoice_value: 50000,
      paid_amount: 0,
    } as never);
    mockedReturnLineRepo.getByPurchaseReturnIds.mockResolvedValueOnce(
      [] as never,
    );
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 100, qty: 2 },
    ] as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        purchase_return_id: 10,
        return_date: "2026-04-14",
        lines: [
          { purchase_order_line_id: 100, return_qty: 2 },
          { purchase_order_line_id: 100, return_qty: 1 },
        ],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Jumlah retur melebihi jumlah barang pada line 100",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("rejects an edit whose replacement exceeds stock after restoring the original return", async () => {
    mockedReturnRepo.getById.mockResolvedValue([
      { purchase_order_id: 30, client_id: 1 },
    ] as never);
    mockedReturnLineRepo.getByPurchaseReturnIds.mockResolvedValueOnce([
      { purchase_order_line_id: 7, stock_id: 3, return_qty: 1 },
    ]);
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([
      { id: 3, ending_stock: 0 },
    ]);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        ...createPayload,
        purchase_return_id: 10,
      }),
    ).rejects.toMatchObject({
      message: "Jumlah retur melebihi stok tersedia pada stok 3",
      statusCode: 400,
    });
    expect(mockedOrderLineRepo.bulkIncrementQuantity).not.toHaveBeenCalled();
    expect(mockedReturnRepo.deleteById).not.toHaveBeenCalled();
  });

  it.each(["edit", "delete"])(
    "rejects a stale %s after another transaction removes the return",
    async (action) => {
      let wasRemoved = false;
      mockedReturnRepo.getById.mockImplementation(
        () =>
          Promise.resolve(
            wasRemoved ? [] : [{ purchase_order_id: 30, client_id: 1 }],
          ) as never,
      );
      mockedOrderRepo.getById.mockImplementationOnce(async () => {
        wasRemoved = true;
        return { id: 30, client_id: 1, invoice_value: 130000, paid_amount: 0 };
      });

      const result =
        action === "edit"
          ? purchaseReturnService.updatePurchaseReturn({
              ...createPayload,
              purchase_return_id: 10,
            })
          : purchaseReturnService.deletePurchaseReturn(10);

      await expect(result).rejects.toMatchObject({ statusCode: 404 });
      expect(mockedOrderLineRepo.bulkIncrementQuantity).not.toHaveBeenCalled();
      expect(mockedReturnRepo.deleteById).not.toHaveBeenCalled();
      expect(mockedClientRepo.incPayableBalance).not.toHaveBeenCalled();
    },
  );

  it("updatePurchaseReturn cancels when all return qty are zero", async () => {
    mockedReturnRepo.getById.mockResolvedValue([
      { purchase_order_id: 6, client_id: 1 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 6,
      client_id: 1,
      invoice_value: 50000,
      paid_amount: 0,
    } as never);
    mockedReturnLineRepo.getByPurchaseReturnIds.mockResolvedValueOnce(
      [] as never,
    );
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 100, qty: 2 },
    ] as never);
    mockedOrderRepo.getDiscountById.mockResolvedValueOnce(10 as never);
    mockedOrderLineRepo.getSumTotalPriceByOrderId.mockResolvedValueOnce(
      60000 as never,
    );

    const result = await purchaseReturnService.updatePurchaseReturn({
      purchase_return_id: 10,
      return_date: "2026-04-14",
      lines: [{ purchase_order_line_id: 100, return_qty: 0 }],
    });

    expect(mockedOrderRepo.updateInvoiceValue).toHaveBeenCalledWith(
      54000,
      6,
      tx,
    );
    expect(mockedClientRepo.incPayableBalance).toHaveBeenCalledWith(
      1,
      4000,
      tx,
    );
    expect(result).toEqual({
      message:
        "Dokumen retur pembelian berhasil dibatalkan karena semua jumlah retur di-nol-kan",
    });
  });

  it("updatePurchaseReturn runs full edit flow and returns success message", async () => {
    mockedReturnRepo.getById.mockResolvedValue([
      { purchase_order_id: 10, client_id: 9 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 10,
      client_id: 9,
      invoice_value: 100000,
      paid_amount: 0,
    } as never);
    mockedReturnLineRepo.getByPurchaseReturnIds.mockResolvedValueOnce([
      { purchase_order_line_id: 8, return_qty: 1, stock_id: 5 },
      { purchase_order_line_id: 7, return_qty: 1, stock_id: 3 },
    ] as never);
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 7, qty: 1, stock_id: 3, price: 12000 },
      { id: 8, qty: 0, stock_id: 5, price: 12000 },
    ]);
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([
      { id: 3, ending_stock: 1 },
      { id: 5, ending_stock: 0 },
    ]);
    mockedReturnRepo.createPurchaseReturn.mockResolvedValueOnce([
      { id: 88 },
    ] as never);
    mockedOrderRepo.getDiscountById.mockResolvedValueOnce(0 as never);
    mockedOrderLineRepo.getSumTotalPriceByOrderId.mockResolvedValueOnce(
      70000 as never,
    );

    const result = await purchaseReturnService.updatePurchaseReturn({
      purchase_return_id: 50,
      return_date: "2026-04-16",
      lines: [{ purchase_order_line_id: 7, return_qty: 2 }],
    });

    expect(mockedStockRepo.getStocksForUpdate).toHaveBeenCalledWith([3, 5], tx);
    expect(mockedOrderLineRepo.bulkIncrementQuantity).toHaveBeenCalledWith(
      [
        { id: 8, quantity: 1 },
        { id: 7, quantity: 1 },
      ],
      tx,
    );
    expect(
      mockedStockRepo.bulkIncrementStockAndDecrementQtyOut,
    ).toHaveBeenCalledWith(
      [
        { id: 5, quantity: 1 },
        { id: 3, quantity: 1 },
      ],
      tx,
    );
    expect(mockedReturnLineRepo.deleteByPurchaseReturnIds).toHaveBeenCalledWith(
      [50],
      tx,
    );
    expect(mockedReturnRepo.deleteById).toHaveBeenCalledWith(50, tx);
    expect(mockedReturnLineRepo.createPurchaseReturnLine).toHaveBeenCalledWith(
      [
        {
          purchase_order_line_id: 7,
          return_qty: 2,
          price: 12000,
          stock_id: 3,
        },
      ],
      88,
      tx,
    );
    expect(mockedOrderLineRepo.bulkDecrementQuantity).toHaveBeenCalledWith(
      [{ id: 7, quantity: 2 }],
      tx,
    );
    expect(
      mockedStockRepo.bulkDecrementStockAndIncrementQtyOut,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 2 }], tx);
    expect(mockedOrderRepo.updateInvoiceValue).toHaveBeenCalledWith(
      70000,
      10,
      tx,
    );
    expect(mockedClientRepo.incPayableBalance).toHaveBeenCalledWith(
      9,
      -30000,
      tx,
    );
    expect(result).toEqual({ message: "Purchase return updated successfully" });
  });
});
