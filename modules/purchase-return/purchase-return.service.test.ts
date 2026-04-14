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
    hasReturnForPurchaseOrder: jest.fn(),
    createPurchaseReturn: jest.fn(),
    getUnpaidReturnedInvoices: jest.fn(),
    getEditPurchaseReturnDetailByInvoice: jest.fn(),
    getByPurchaseOrderId: jest.fn(),
    deleteByPurchaseOrderId: jest.fn(),
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
    getLineDetails: jest.fn(),
    bulkDecrementQuantity: jest.fn(),
    bulkIncrementQuantity: jest.fn(),
    getSumTotalPriceByOrderId: jest.fn(),
    getByPurchaseOrderId: jest.fn(),
  },
}));

jest.mock("../stock/stock.repository", () => ({
  stockRepository: {
    bulkDecrementStockAndIncrementQtyOut: jest.fn(),
    bulkIncrementStockAndDecrementQtyOut: jest.fn(),
  },
}));

jest.mock("../purchase/purchase-order.repository", () => ({
  purchaseOrderRepository: {
    getDiscountById: jest.fn(),
    getInvoiceValueById: jest.fn(),
    updateInvoiceValue: jest.fn(),
    getByInvoiceNumber: jest.fn(),
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
    jest.clearAllMocks();
    mockedTransaction.mockImplementation(
      async (cb: (txArg: unknown) => unknown) => cb(tx),
    );
  });

  it("createPurchaseReturn throws when return already exists for invoice", async () => {
    mockedReturnRepo.hasReturnForPurchaseOrder.mockResolvedValueOnce(
      true as never,
    );

    await expect(
      purchaseReturnService.createPurchaseReturn(createPayload),
    ).rejects.toEqual(
      expect.objectContaining({
        message:
          "Retur pembelian untuk nota ini sudah ada, gunakan menu edit retur",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("createPurchaseReturn throws when insert result is empty", async () => {
    mockedReturnRepo.hasReturnForPurchaseOrder.mockResolvedValueOnce(
      false as never,
    );
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

  it("createPurchaseReturn throws when line detail cannot be found", async () => {
    mockedReturnRepo.hasReturnForPurchaseOrder.mockResolvedValueOnce(
      false as never,
    );
    mockedReturnRepo.createPurchaseReturn.mockResolvedValueOnce([
      { id: 10 },
    ] as never);
    mockedOrderLineRepo.getLineDetails.mockResolvedValueOnce([] as never);

    await expect(
      purchaseReturnService.createPurchaseReturn(createPayload),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Order line 7 not found",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("createPurchaseReturn runs full create flow and updates payable delta", async () => {
    mockedReturnRepo.hasReturnForPurchaseOrder.mockResolvedValueOnce(
      false as never,
    );
    mockedReturnRepo.createPurchaseReturn.mockResolvedValueOnce([
      { id: 99 },
    ] as never);
    mockedOrderLineRepo.getLineDetails.mockResolvedValueOnce([
      { id: 7, stock_id: 3, price: 12000 },
    ] as never);
    mockedOrderRepo.getDiscountById.mockResolvedValueOnce(10 as never);
    mockedOrderLineRepo.getSumTotalPriceByOrderId.mockResolvedValueOnce(
      100000 as never,
    );
    mockedOrderRepo.getInvoiceValueById.mockResolvedValueOnce(130000 as never);

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

  it("getUnpaidReturnedInvoices proxies repository output", async () => {
    mockedReturnRepo.getUnpaidReturnedInvoices.mockResolvedValueOnce([
      { id: 1, invoice_number: "PB-1" },
    ] as never);

    await expect(
      purchaseReturnService.getUnpaidReturnedInvoices(),
    ).resolves.toEqual([{ id: 1, invoice_number: "PB-1" }]);
  });

  it("getEditPurchaseReturnDetail throws when invoice is missing", async () => {
    mockedReturnRepo.getEditPurchaseReturnDetailByInvoice.mockResolvedValueOnce(
      null as never,
    );

    await expect(
      purchaseReturnService.getEditPurchaseReturnDetail("PB-404"),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Invoice retur tidak ditemukan",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("updatePurchaseReturn throws when invoice is not found", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce(
      undefined as never,
    );

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        invoice_number: " pb-10 ",
        return_date: "2026-04-14",
        lines: [],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Invoice not found",
        statusCode: 404,
      }) as AppError,
    );

    expect(mockedOrderRepo.getByInvoiceNumber).toHaveBeenCalledWith(
      "PB-10",
      tx,
    );
  });

  it("updatePurchaseReturn throws when invoice already has payment", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 5,
      paid_amount: 1,
    } as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        invoice_number: "PB-5",
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

  it("updatePurchaseReturn throws when existing return rows are missing", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 5,
      paid_amount: 0,
    } as never);
    mockedReturnRepo.getByPurchaseOrderId.mockResolvedValueOnce([] as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        invoice_number: "PB-5",
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

  it("updatePurchaseReturn throws when line does not belong to selected invoice", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 6,
      client_id: 1,
      invoice_value: 50000,
      paid_amount: 0,
    } as never);
    mockedReturnRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 1 },
    ] as never);
    mockedReturnLineRepo.getByPurchaseReturnIds.mockResolvedValueOnce(
      [] as never,
    );
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 100, qty: 3 },
    ] as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        invoice_number: "PB-6",
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

  it("updatePurchaseReturn throws when return qty exceeds current qty", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 6,
      client_id: 1,
      invoice_value: 50000,
      paid_amount: 0,
    } as never);
    mockedReturnRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 1 },
    ] as never);
    mockedReturnLineRepo.getByPurchaseReturnIds.mockResolvedValueOnce(
      [] as never,
    );
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 100, qty: 2 },
    ] as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        invoice_number: "PB-6",
        return_date: "2026-04-14",
        lines: [{ purchase_order_line_id: 100, return_qty: 5 }],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Jumlah retur melebihi jumlah barang pada line 100",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("updatePurchaseReturn throws when no positive return rows are selected", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 6,
      client_id: 1,
      invoice_value: 50000,
      paid_amount: 0,
    } as never);
    mockedReturnRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 1 },
    ] as never);
    mockedReturnLineRepo.getByPurchaseReturnIds.mockResolvedValueOnce(
      [] as never,
    );
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 100, qty: 2 },
    ] as never);

    await expect(
      purchaseReturnService.updatePurchaseReturn({
        invoice_number: "PB-6",
        return_date: "2026-04-14",
        lines: [{ purchase_order_line_id: 100, return_qty: 0 }],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Pilih minimal 1 item untuk diretur",
        statusCode: 400,
      }) as AppError,
    );
  });

  it("updatePurchaseReturn runs full edit flow and returns success message", async () => {
    mockedOrderRepo.getByInvoiceNumber.mockResolvedValueOnce({
      id: 10,
      client_id: 9,
      invoice_value: 100000,
      paid_amount: 0,
    } as never);
    mockedReturnRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 50 },
      { id: 51 },
    ] as never);
    mockedReturnLineRepo.getByPurchaseReturnIds.mockResolvedValueOnce([
      { purchase_order_line_id: 7, return_qty: 1, stock_id: 3 },
    ] as never);
    mockedOrderLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { id: 7, qty: 3 },
    ] as never);
    mockedOrderLineRepo.getLineDetails.mockResolvedValueOnce([
      { id: 7, stock_id: 3, price: 12000 },
    ] as never);
    mockedReturnRepo.createPurchaseReturn.mockResolvedValueOnce([
      { id: 88 },
    ] as never);
    mockedOrderRepo.getDiscountById.mockResolvedValueOnce(0 as never);
    mockedOrderLineRepo.getSumTotalPriceByOrderId.mockResolvedValueOnce(
      70000 as never,
    );

    const result = await purchaseReturnService.updatePurchaseReturn({
      invoice_number: "pb-10",
      return_date: "2026-04-16",
      lines: [{ purchase_order_line_id: 7, return_qty: 2 }],
    });

    expect(mockedOrderLineRepo.bulkIncrementQuantity).toHaveBeenCalledWith(
      [{ id: 7, quantity: 1 }],
      tx,
    );
    expect(
      mockedStockRepo.bulkIncrementStockAndDecrementQtyOut,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 1 }], tx);
    expect(mockedReturnLineRepo.deleteByPurchaseReturnIds).toHaveBeenCalledWith(
      [50, 51],
      tx,
    );
    expect(mockedReturnRepo.deleteByPurchaseOrderId).toHaveBeenCalledWith(
      10,
      tx,
    );
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
