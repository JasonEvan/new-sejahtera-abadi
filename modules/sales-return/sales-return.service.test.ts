import db from "@/lib/drizzle";
import { AppError } from "@/lib/errors";
import { clientRepository } from "../client/client.repository";
import { saleOrderLineRepository } from "../sale/sale-order-line.repository";
import { saleOrderRepository } from "../sale/sale-order.repository";
import { stockRepository } from "../stock/stock.repository";
import { salesReturnLineRepository } from "./sales-return-line.repository";
import { salesReturnRepository } from "./sales-return.repository";
import { salesReturnService } from "./sales-return.service";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

jest.mock("./sales-return.repository", () => ({
  salesReturnRepository: {
    createSalesReturn: jest.fn(),
    getUnpaidReturnedInvoices: jest.fn(),
    getEditSaleReturnDetailById: jest.fn(),
    getById: jest.fn(),
    deleteById: jest.fn(),
    getReturnHistoryBySalesOrderId: jest.fn(),
  },
}));

jest.mock("./sales-return-line.repository", () => ({
  salesReturnLineRepository: {
    createSalesReturnLine: jest.fn(),
    getBySalesReturnIds: jest.fn(),
    deleteBySalesReturnIds: jest.fn(),
  },
}));

jest.mock("../sale/sale-order-line.repository", () => ({
  saleOrderLineRepository: {
    getLineDetails: jest.fn(),
    bulkDecrementQuantity: jest.fn(),
    bulkIncrementQuantity: jest.fn(),
    getSumTotalPriceByOrderId: jest.fn(),
    getBySalesOrderId: jest.fn(),
  },
}));

jest.mock("../stock/stock.repository", () => ({
  stockRepository: {
    bulkIncrementStockAndIncrementQtyIn: jest.fn(),
    bulkDecrementStockAndDecrementQtyIn: jest.fn(),
  },
}));

jest.mock("../sale/sale-order.repository", () => ({
  saleOrderRepository: {
    getDiscountById: jest.fn(),
    getInvoiceValueById: jest.fn(),
    updateInvoiceValue: jest.fn(),
    getById: jest.fn(),
  },
}));

jest.mock("../client/client.repository", () => ({
  clientRepository: {
    incReceivableBalance: jest.fn(),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;
const mockedTransaction = mockedDb.transaction as unknown as jest.Mock;
const mockedReturnRepo = salesReturnRepository as jest.Mocked<
  typeof salesReturnRepository
>;
const mockedReturnLineRepo = salesReturnLineRepository as jest.Mocked<
  typeof salesReturnLineRepository
>;
const mockedOrderLineRepo = saleOrderLineRepository as jest.Mocked<
  typeof saleOrderLineRepository
>;
const mockedStockRepo = stockRepository as jest.Mocked<typeof stockRepository>;
const mockedOrderRepo = saleOrderRepository as jest.Mocked<
  typeof saleOrderRepository
>;
const mockedClientRepo = clientRepository as jest.Mocked<
  typeof clientRepository
>;

describe("sales-return.service", () => {
  const tx = {};

  const createPayload = {
    client_id: 1,
    sales_order_id: 30,
    return_date: "2026-04-14",
    lines: [{ sales_order_line_id: 7, return_qty: 2 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation(
      async (cb: (txArg: unknown) => unknown) => cb(tx),
    );
  });

  it("createSalesReturn throws when insert result is empty", async () => {
    mockedReturnRepo.createSalesReturn.mockResolvedValueOnce([] as never);

    await expect(
      salesReturnService.createSalesReturn(createPayload),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Failed to create sales return",
        statusCode: 500,
      }) as AppError,
    );
  });

  it("createSalesReturn throws when line detail cannot be found", async () => {
    mockedReturnRepo.createSalesReturn.mockResolvedValueOnce([
      { id: 10 },
    ] as never);
    mockedOrderLineRepo.getLineDetails.mockResolvedValueOnce([] as never);

    await expect(
      salesReturnService.createSalesReturn(createPayload),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Order line 7 not found",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("createSalesReturn runs full create flow and updates receivable delta", async () => {
    mockedReturnRepo.createSalesReturn.mockResolvedValueOnce([
      { id: 99 },
    ] as never);
    mockedOrderLineRepo.getLineDetails.mockResolvedValueOnce([
      { id: 7, stock_id: 3, price: 10000 },
    ] as never);
    mockedOrderRepo.getDiscountById.mockResolvedValueOnce(10 as never);
    mockedOrderLineRepo.getSumTotalPriceByOrderId.mockResolvedValueOnce(
      60000 as never,
    );
    mockedOrderRepo.getInvoiceValueById.mockResolvedValueOnce(90000 as never);

    await salesReturnService.createSalesReturn(createPayload);

    expect(mockedReturnLineRepo.createSalesReturnLine).toHaveBeenCalledWith(
      [
        {
          sales_order_line_id: 7,
          return_qty: 2,
          price: 10000,
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
      mockedStockRepo.bulkIncrementStockAndIncrementQtyIn,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 2 }], tx);
    expect(mockedOrderRepo.updateInvoiceValue).toHaveBeenCalledWith(
      54000,
      30,
      tx,
    );
    expect(mockedClientRepo.incReceivableBalance).toHaveBeenCalledWith(
      1,
      -36000,
      tx,
    );
  });

  it("getUnpaidReturnedInvoices proxies repository output", async () => {
    mockedReturnRepo.getUnpaidReturnedInvoices.mockResolvedValueOnce([
      { id: 1, invoice_number: "SJ-1" },
    ] as never);

    await expect(
      salesReturnService.getUnpaidReturnedInvoices(),
    ).resolves.toEqual([{ id: 1, invoice_number: "SJ-1" }]);
  });

  it("getEditSaleReturnDetail throws when return is missing", async () => {
    mockedReturnRepo.getEditSaleReturnDetailById.mockResolvedValueOnce(
      null as never,
    );

    await expect(
      salesReturnService.getEditSaleReturnDetail(404),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Data retur tidak ditemukan",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("updateSaleReturn throws when return is not found", async () => {
    mockedReturnRepo.getById.mockResolvedValueOnce([] as never);

    await expect(
      salesReturnService.updateSaleReturn({
        sales_return_id: 10,
        return_date: "2026-04-14",
        lines: [],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Data retur penjualan tidak ditemukan",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("updateSaleReturn throws when invoice is not found", async () => {
    mockedReturnRepo.getById.mockResolvedValueOnce([
      { sales_order_id: 5 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce(undefined as never);

    await expect(
      salesReturnService.updateSaleReturn({
        sales_return_id: 10,
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

  it("updateSaleReturn throws when invoice already has payment", async () => {
    mockedReturnRepo.getById.mockResolvedValueOnce([
      { sales_order_id: 5 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 5,
      paid_amount: 1,
    } as never);

    await expect(
      salesReturnService.updateSaleReturn({
        sales_return_id: 10,
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

  it("updateSaleReturn throws when line does not belong to selected invoice", async () => {
    mockedReturnRepo.getById.mockResolvedValueOnce([
      { sales_order_id: 6 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 6,
      client_id: 1,
      invoice_value: 50000,
      paid_amount: 0,
    } as never);
    mockedReturnLineRepo.getBySalesReturnIds.mockResolvedValueOnce([] as never);
    mockedOrderLineRepo.getBySalesOrderId.mockResolvedValueOnce([
      { id: 100, qty: 3 },
    ] as never);

    await expect(
      salesReturnService.updateSaleReturn({
        sales_return_id: 10,
        return_date: "2026-04-14",
        lines: [{ sales_order_line_id: 101, return_qty: 1 }],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Order line 101 does not belong to selected invoice",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("updateSaleReturn throws when return qty exceeds current qty", async () => {
    mockedReturnRepo.getById.mockResolvedValueOnce([
      { sales_order_id: 6 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 6,
      client_id: 1,
      invoice_value: 50000,
      paid_amount: 0,
    } as never);
    mockedReturnLineRepo.getBySalesReturnIds.mockResolvedValueOnce([] as never);
    mockedOrderLineRepo.getBySalesOrderId.mockResolvedValueOnce([
      { id: 100, qty: 2 },
    ] as never);

    await expect(
      salesReturnService.updateSaleReturn({
        sales_return_id: 10,
        return_date: "2026-04-14",
        lines: [{ sales_order_line_id: 100, return_qty: 5 }],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Jumlah retur melebihi jumlah barang pada line 100",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("updateSaleReturn cancels when all return qty are zero", async () => {
    mockedReturnRepo.getById.mockResolvedValueOnce([
      { sales_order_id: 6 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 6,
      client_id: 1,
      invoice_value: 50000,
      paid_amount: 0,
    } as never);
    mockedReturnLineRepo.getBySalesReturnIds.mockResolvedValueOnce([] as never);
    mockedOrderLineRepo.getBySalesOrderId.mockResolvedValueOnce([
      { id: 100, qty: 2 },
    ] as never);
    mockedOrderRepo.getDiscountById.mockResolvedValueOnce(10 as never);
    mockedOrderLineRepo.getSumTotalPriceByOrderId.mockResolvedValueOnce(
      60000 as never,
    );

    const result = await salesReturnService.updateSaleReturn({
      sales_return_id: 10,
      return_date: "2026-04-14",
      lines: [{ sales_order_line_id: 100, return_qty: 0 }],
    });

    expect(mockedOrderRepo.updateInvoiceValue).toHaveBeenCalledWith(
      54000,
      6,
      tx,
    );
    expect(mockedClientRepo.incReceivableBalance).toHaveBeenCalledWith(
      1,
      4000,
      tx,
    );
    expect(result).toEqual({
      message:
        "Dokumen retur berhasil dibatalkan karena semua jumlah retur di-nol-kan",
    });
  });

  it("updateSaleReturn runs full edit flow and returns success message", async () => {
    mockedReturnRepo.getById.mockResolvedValueOnce([
      { sales_order_id: 10 },
    ] as never);
    mockedOrderRepo.getById.mockResolvedValueOnce({
      id: 10,
      client_id: 9,
      invoice_value: 100000,
      paid_amount: 0,
    } as never);
    mockedReturnLineRepo.getBySalesReturnIds.mockResolvedValueOnce([
      { sales_order_line_id: 7, return_qty: 1, stock_id: 3 },
    ] as never);
    mockedOrderLineRepo.getBySalesOrderId.mockResolvedValueOnce([
      { id: 7, qty: 3 },
    ] as never);
    mockedOrderLineRepo.getLineDetails.mockResolvedValueOnce([
      { id: 7, stock_id: 3, price: 12000 },
    ] as never);
    mockedReturnRepo.createSalesReturn.mockResolvedValueOnce([
      { id: 88 },
    ] as never);
    mockedOrderRepo.getDiscountById.mockResolvedValueOnce(0 as never);
    mockedOrderLineRepo.getSumTotalPriceByOrderId.mockResolvedValueOnce(
      70000 as never,
    );

    const result = await salesReturnService.updateSaleReturn({
      sales_return_id: 50,
      return_date: "2026-04-16",
      lines: [{ sales_order_line_id: 7, return_qty: 2 }],
    });

    expect(mockedOrderLineRepo.bulkIncrementQuantity).toHaveBeenCalledWith(
      [{ id: 7, quantity: 1 }],
      tx,
    );
    expect(
      mockedStockRepo.bulkDecrementStockAndDecrementQtyIn,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 1 }], tx);
    expect(mockedReturnLineRepo.deleteBySalesReturnIds).toHaveBeenCalledWith(
      [50],
      tx,
    );
    expect(mockedReturnRepo.deleteById).toHaveBeenCalledWith(50, tx);
    expect(mockedReturnLineRepo.createSalesReturnLine).toHaveBeenCalledWith(
      [
        {
          sales_order_line_id: 7,
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
      mockedStockRepo.bulkIncrementStockAndIncrementQtyIn,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 2 }], tx);
    expect(mockedOrderRepo.updateInvoiceValue).toHaveBeenCalledWith(
      70000,
      10,
      tx,
    );
    expect(mockedClientRepo.incReceivableBalance).toHaveBeenCalledWith(
      9,
      -30000,
      tx,
    );
    expect(result).toEqual({ message: "Sales return updated successfully" });
  });
});
