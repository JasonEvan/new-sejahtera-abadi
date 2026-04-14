import db from "@/lib/drizzle";
import { AppError } from "@/lib/errors";
import { clientRepository } from "../client/client.repository";
import { purchaseReturnRepository } from "../purchase-return/purchase-return.repository";
import { stockRepository } from "../stock/stock.repository";
import { purchaseOrderLineRepository } from "./purchase-order-line.repository";
import { purchaseOrderRepository } from "./purchase-order.repository";
import { purchaseService } from "./purchase.service";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

jest.mock("./purchase-order.repository", () => ({
  purchaseOrderRepository: {
    insertPurchaseOrder: jest.fn(),
    getById: jest.fn(),
    updateInvoiceMeta: jest.fn(),
    getOrdersMenu: jest.fn(),
    getPurchaseInvoices: jest.fn(),
    getReturnEligibleOrders: jest.fn(),
    getPurchaseReturnLinesWithMeta: jest.fn(),
    getPurchaseInvoiceDetail: jest.fn(),
    getLatestPurchasedItemsByClient: jest.fn(),
  },
}));

jest.mock("./purchase-order-line.repository", () => ({
  purchaseOrderLineRepository: {
    insertPurchaseOrderLine: jest.fn(),
    getByPurchaseOrderId: jest.fn(),
    deleteByPurchaseOrderId: jest.fn(),
    insertPurchaseOrderLineForEdit: jest.fn(),
  },
}));

jest.mock("../stock/stock.repository", () => ({
  stockRepository: {
    getStocksForUpdate: jest.fn(),
    bulkIncrementStockAndIncrementQtyIn: jest.fn(),
    bulkDecrementStockAndDecrementQtyIn: jest.fn(),
  },
}));

jest.mock("../client/client.repository", () => ({
  clientRepository: {
    incPayableBalance: jest.fn(),
  },
}));

jest.mock("../purchase-return/purchase-return.repository", () => ({
  purchaseReturnRepository: {
    hasReturnForPurchaseOrder: jest.fn(),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;
const mockedTransaction = mockedDb.transaction as unknown as jest.Mock;
const mockedOrderRepo = purchaseOrderRepository as jest.Mocked<
  typeof purchaseOrderRepository
>;
const mockedLineRepo = purchaseOrderLineRepository as jest.Mocked<
  typeof purchaseOrderLineRepository
>;
const mockedStockRepo = stockRepository as jest.Mocked<typeof stockRepository>;
const mockedClientRepo = clientRepository as jest.Mocked<
  typeof clientRepository
>;
const mockedReturnRepo = purchaseReturnRepository as jest.Mocked<
  typeof purchaseReturnRepository
>;

describe("purchase.service", () => {
  const tx = {};

  const createPayload = {
    client_id: 1,
    total: 100000,
    discount: 2000,
    cart: [
      {
        stock_id: 3,
        name: "Screw",
        quantity: 5,
        product_price: 12000,
        selling_price: 15000,
      },
    ],
  };

  const editPayload = {
    client_id: 1,
    total: 120000,
    discount: 500,
    cart: [
      {
        stock_id: 3,
        name: "Screw",
        quantity: 7,
        product_price: 11000,
        selling_price: 15000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation(
      async (cb: (txArg: unknown) => unknown) => cb(tx),
    );
  });

  it("validateStockReductionAvailability throws when stock is insufficient", async () => {
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([
      { id: 3, ending_stock: 1 },
    ] as never);

    await expect(
      purchaseService.validateStockReductionAvailability(
        [{ stock_id: 3, qty: 2 }],
        tx as never,
      ),
    ).rejects.toThrow("Stok saat ini tidak cukup");

    expect(mockedStockRepo.getStocksForUpdate).toHaveBeenCalledWith([3], tx);
  });

  it("validateStockReductionAvailability ignores null stock_id", async () => {
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([] as never);

    await purchaseService.validateStockReductionAvailability(
      [{ stock_id: null, qty: 9 }],
      tx as never,
    );

    expect(mockedStockRepo.getStocksForUpdate).toHaveBeenCalledWith([], tx);
  });

  it("createPurchase executes full write flow", async () => {
    mockedOrderRepo.insertPurchaseOrder.mockResolvedValueOnce([
      { id: 91 },
    ] as never);

    await purchaseService.createPurchase(createPayload as never);

    expect(mockedOrderRepo.insertPurchaseOrder).toHaveBeenCalledWith(
      createPayload,
      tx,
    );
    expect(mockedLineRepo.insertPurchaseOrderLine).toHaveBeenCalledWith(
      createPayload,
      91,
      tx,
    );
    expect(
      mockedStockRepo.bulkIncrementStockAndIncrementQtyIn,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 5, product_price: 12000 }], tx);
    expect(mockedClientRepo.incPayableBalance).toHaveBeenCalledWith(
      1,
      100000,
      tx,
    );
  });

  it("createPurchase throws when inserted order is empty", async () => {
    mockedOrderRepo.insertPurchaseOrder.mockResolvedValueOnce([] as never);

    await expect(
      purchaseService.createPurchase(createPayload as never),
    ).rejects.toThrow("Failed to create purchase order");

    expect(mockedLineRepo.insertPurchaseOrderLine).not.toHaveBeenCalled();
  });

  it("updatePurchase throws when order is missing", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce(undefined as never);

    await expect(
      purchaseService.updatePurchase(5, editPayload as never),
    ).rejects.toThrow("Purchase order not found");
  });

  it("updatePurchase throws when order already has return", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce({ client_id: 1 } as never);
    mockedReturnRepo.hasReturnForPurchaseOrder.mockResolvedValueOnce(
      true as never,
    );

    await expect(
      purchaseService.updatePurchase(5, editPayload as never),
    ).rejects.toThrow("sudah memiliki retur pembelian");
  });

  it("updatePurchase throws when client differs", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce({
      client_id: 999,
      invoice_value: 100,
      paid_amount: 0,
    } as never);
    mockedReturnRepo.hasReturnForPurchaseOrder.mockResolvedValueOnce(
      false as never,
    );

    await expect(
      purchaseService.updatePurchase(5, editPayload as never),
    ).rejects.toThrow("Client does not match selected purchase order");
  });

  it("updatePurchase throws when new total is less than paid amount", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce({
      client_id: 1,
      invoice_value: 100000,
      paid_amount: 200000,
    } as never);
    mockedReturnRepo.hasReturnForPurchaseOrder.mockResolvedValueOnce(
      false as never,
    );
    mockedLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([] as never);

    await expect(
      purchaseService.updatePurchase(5, editPayload as never),
    ).rejects.toThrow("New total cannot be lower than amount already paid");
  });

  it("updatePurchase runs full edit flow and updates payable delta", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce({
      client_id: 1,
      invoice_value: 100000,
      paid_amount: 10000,
    } as never);
    mockedReturnRepo.hasReturnForPurchaseOrder.mockResolvedValueOnce(
      false as never,
    );
    mockedLineRepo.getByPurchaseOrderId.mockResolvedValueOnce([
      { stock_id: 3, qty: 2 },
    ] as never);
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([
      { id: 3, ending_stock: 9 },
    ] as never);

    await purchaseService.updatePurchase(9, editPayload as never);

    expect(
      mockedStockRepo.bulkDecrementStockAndDecrementQtyIn,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 2 }], tx);
    expect(mockedLineRepo.deleteByPurchaseOrderId).toHaveBeenCalledWith(9, tx);
    expect(mockedLineRepo.insertPurchaseOrderLineForEdit).toHaveBeenCalledWith(
      { client_id: 1, cart: editPayload.cart },
      9,
      tx,
    );
    expect(
      mockedStockRepo.bulkIncrementStockAndIncrementQtyIn,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 7, product_price: 11000 }], tx);
    expect(mockedOrderRepo.updateInvoiceMeta).toHaveBeenCalledWith(
      9,
      { invoiceValue: 120000, discount: 500, balanceDue: 110000 },
      tx,
    );
    expect(mockedClientRepo.incPayableBalance).toHaveBeenCalledWith(
      1,
      20000,
      tx,
    );
  });

  it("getPurchaseReturnLines throws AppError when invoice is missing", async () => {
    mockedOrderRepo.getPurchaseReturnLinesWithMeta.mockResolvedValueOnce(
      null as never,
    );

    await expect(
      purchaseService.getPurchaseReturnLines("INV-X"),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "Invoice not found",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("getPurchaseInvoiceDetail formats date and appends TOTAL row", async () => {
    mockedOrderRepo.getPurchaseInvoiceDetail.mockResolvedValueOnce({
      header: {
        invoice_number: "PB-1",
        invoice_date: "2026-04-14",
        invoice_value: 45000,
        client_name: "ACME",
        client_city: "Bandung",
      },
      lines: [
        { name: "A", qty: 2, unit: "pcs", price: 10000, total_price: 20000 },
        { name: "B", qty: 1, unit: "pcs", price: 25000, total_price: 25000 },
      ],
    } as never);

    const result = await purchaseService.getPurchaseInvoiceDetail("PB-1");

    expect(result.header.invoice_date).toBe("14/04/2026");
    expect(result.lines).toHaveLength(3);
    expect(result.lines[2]).toEqual({
      name: "TOTAL",
      qty: null,
      unit: null,
      price: null,
      total_price: 45000,
    });
  });

  it("delegates query methods to repository", async () => {
    mockedOrderRepo.getOrdersMenu.mockResolvedValueOnce([{ id: 1 }] as never);
    mockedOrderRepo.getPurchaseInvoices.mockResolvedValueOnce([
      { invoice_number: "X" },
    ] as never);
    mockedOrderRepo.getReturnEligibleOrders.mockResolvedValueOnce([
      { id: 2 },
    ] as never);
    mockedOrderRepo.getLatestPurchasedItemsByClient.mockResolvedValueOnce([
      { name: "A" },
    ] as never);

    await expect(purchaseService.getOrdersMenu(1, true)).resolves.toEqual([
      { id: 1 },
    ]);
    await expect(purchaseService.getPurchaseInvoices("P")).resolves.toEqual([
      { invoice_number: "X" },
    ]);
    await expect(purchaseService.getReturnEligibleOrders(1)).resolves.toEqual([
      { id: 2 },
    ]);
    await expect(
      purchaseService.getLatestPurchasedItemsByClient(1, "A"),
    ).resolves.toEqual([{ name: "A" }]);
  });
});
