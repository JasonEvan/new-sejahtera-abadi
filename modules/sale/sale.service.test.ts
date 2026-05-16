import db from "@/lib/drizzle";
import { AppError } from "@/lib/errors";
import { clientRepository } from "../client/client.repository";
import { salespersonRepository } from "../salesperson/salesperson.repository";
import { salesReturnRepository } from "../sales-return/sales-return.repository";
import { stockRepository } from "../stock/stock.repository";
import { saleOrderLineRepository } from "./sale-order-line.repository";
import { saleOrderRepository } from "./sale-order.repository";
import { saleService } from "./sale.service";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

jest.mock("./sale-order.repository", () => ({
  saleOrderRepository: {
    insertSaleOrder: jest.fn(),
    getById: jest.fn(),
    updateInvoiceMeta: jest.fn(),
    getOrdersMenu: jest.fn(),
    getSalesInvoices: jest.fn(),
    getSalesInvoiceDetail: jest.fn(),
    getReturnEligibleOrders: jest.fn(),
    getSaleReturnLinesWithMeta: jest.fn(),
    getLatestSoldItemsByClient: jest.fn(),
  },
}));

jest.mock("./sale-order-line.repository", () => ({
  saleOrderLineRepository: {
    insertSaleOrderLine: jest.fn(),
    getBySalesOrderId: jest.fn(),
    deleteBySalesOrderId: jest.fn(),
    insertSaleOrderLineForEdit: jest.fn(),
  },
}));

jest.mock("../stock/stock.repository", () => ({
  stockRepository: {
    getStocksForUpdate: jest.fn(),
    bulkDecrementStockAndIncrementQtyOut: jest.fn(),
    bulkIncrementStockAndDecrementQtyOut: jest.fn(),
  },
}));

jest.mock("../salesperson/salesperson.repository", () => ({
  salespersonRepository: {
    incInvoiceNumber: jest.fn(),
  },
}));

jest.mock("../client/client.repository", () => ({
  clientRepository: {
    incReceivableBalance: jest.fn(),
  },
}));

jest.mock("../sales-return/sales-return.repository", () => ({
  salesReturnRepository: {
    hasReturnForSalesOrder: jest.fn(),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;
const mockedTransaction = mockedDb.transaction as unknown as jest.Mock;
const mockedOrderRepo = saleOrderRepository as jest.Mocked<
  typeof saleOrderRepository
>;
const mockedLineRepo = saleOrderLineRepository as jest.Mocked<
  typeof saleOrderLineRepository
>;
const mockedStockRepo = stockRepository as jest.Mocked<typeof stockRepository>;
const mockedSalespersonRepo = salespersonRepository as jest.Mocked<
  typeof salespersonRepository
>;
const mockedClientRepo = clientRepository as jest.Mocked<
  typeof clientRepository
>;
const mockedReturnRepo = salesReturnRepository as jest.Mocked<
  typeof salesReturnRepository
>;

describe("sale.service", () => {
  const tx = {};

  const createPayload = {
    client_id: 1,
    salesman_id: 3,
    total: 200000,
    discount: 5000,
    cart: [
      {
        stock_id: 3,
        name: "Cable",
        quantity: 2,
        selling_price: 120000,
        capital_cost: 80000,
      },
    ],
  };

  const editPayload = {
    client_id: 1,
    total: 180000,
    discount: 0,
    cart: [
      {
        stock_id: 3,
        name: "Cable",
        quantity: 1,
        selling_price: 120000,
        capital_cost: 80000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation(
      async (cb: (txArg: unknown) => unknown) => cb(tx),
    );
  });

  it("validateStockAvailability throws when cart is empty", async () => {
    await expect(
      saleService.validateStockAvailability([], tx as never),
    ).rejects.toThrow("Cart cannot be empty");
  });

  it("validateStockAvailability throws when stock does not exist", async () => {
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([] as never);

    await expect(
      saleService.validateStockAvailability(
        createPayload.cart as never,
        tx as never,
      ),
    ).rejects.toThrow("Stock Cable not found");
  });

  it("validateStockAvailability throws when stock is insufficient", async () => {
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([
      { id: 3, ending_stock: 1 },
    ] as never);

    await expect(
      saleService.validateStockAvailability(
        createPayload.cart as never,
        tx as never,
      ),
    ).rejects.toThrow("Not enough stock for Cable");
  });

  it("createSale executes full write flow", async () => {
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([
      { id: 3, ending_stock: 10 },
    ] as never);
    mockedOrderRepo.insertSaleOrder.mockResolvedValueOnce([
      { id: 71 },
    ] as never);

    await saleService.createSale(createPayload as never);

    expect(mockedOrderRepo.insertSaleOrder).toHaveBeenCalledWith(
      createPayload,
      tx,
    );
    expect(mockedLineRepo.insertSaleOrderLine).toHaveBeenCalledWith(
      createPayload,
      71,
      tx,
    );
    expect(
      mockedStockRepo.bulkDecrementStockAndIncrementQtyOut,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 2 }], tx);
    expect(mockedSalespersonRepo.incInvoiceNumber).toHaveBeenCalledWith(3, tx);
    expect(mockedClientRepo.incReceivableBalance).toHaveBeenCalledWith(
      1,
      200000,
      tx,
    );
  });

  it("createSale throws when inserted order is empty", async () => {
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([
      { id: 3, ending_stock: 10 },
    ] as never);
    mockedOrderRepo.insertSaleOrder.mockResolvedValueOnce([] as never);

    await expect(
      saleService.createSale(createPayload as never),
    ).rejects.toThrow("Failed to create sale order");

    expect(mockedLineRepo.insertSaleOrderLine).not.toHaveBeenCalled();
  });

  it("updateSale throws when order is missing", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce(undefined as never);

    await expect(
      saleService.updateSale(10, editPayload as never),
    ).rejects.toThrow("Sales order not found");
  });

  it("updateSale throws when order already has return", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce({ client_id: 1 } as never);
    mockedReturnRepo.hasReturnForSalesOrder.mockResolvedValueOnce(
      true as never,
    );

    await expect(
      saleService.updateSale(10, editPayload as never),
    ).rejects.toThrow("sudah memiliki retur penjualan");
  });

  it("updateSale throws when client differs", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce({
      client_id: 2,
      invoice_value: 100,
      paid_amount: 0,
    } as never);
    mockedReturnRepo.hasReturnForSalesOrder.mockResolvedValueOnce(
      false as never,
    );

    await expect(
      saleService.updateSale(10, editPayload as never),
    ).rejects.toThrow("Client does not match selected sales order");
  });

  it("updateSale throws when new total is lower than paid amount", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce({
      client_id: 1,
      invoice_value: 200000,
      paid_amount: 250000,
    } as never);
    mockedReturnRepo.hasReturnForSalesOrder.mockResolvedValueOnce(
      false as never,
    );
    mockedLineRepo.getBySalesOrderId.mockResolvedValueOnce([] as never);
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([
      { id: 3, ending_stock: 10 },
    ] as never);

    await expect(
      saleService.updateSale(10, editPayload as never),
    ).rejects.toThrow("New total cannot be lower than amount already paid");
  });

  it("updateSale runs full edit flow and updates receivable delta", async () => {
    mockedOrderRepo.getById.mockResolvedValueOnce({
      client_id: 1,
      invoice_value: 150000,
      paid_amount: 10000,
    } as never);
    mockedReturnRepo.hasReturnForSalesOrder.mockResolvedValueOnce(
      false as never,
    );
    mockedLineRepo.getBySalesOrderId.mockResolvedValueOnce([
      { stock_id: 3, qty: 2 },
    ] as never);
    mockedStockRepo.getStocksForUpdate.mockResolvedValueOnce([
      { id: 3, ending_stock: 10 },
    ] as never);

    await saleService.updateSale(10, editPayload as never);

    expect(
      mockedStockRepo.bulkIncrementStockAndDecrementQtyOut,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 2 }], tx);
    expect(mockedLineRepo.deleteBySalesOrderId).toHaveBeenCalledWith(10, tx);
    expect(mockedLineRepo.insertSaleOrderLineForEdit).toHaveBeenCalledWith(
      { client_id: 1, salesperson_id: null, cart: editPayload.cart },
      10,
      tx,
    );
    expect(
      mockedStockRepo.bulkDecrementStockAndIncrementQtyOut,
    ).toHaveBeenCalledWith([{ id: 3, quantity: 1 }], tx);
    expect(mockedOrderRepo.updateInvoiceMeta).toHaveBeenCalledWith(
      10,
      { invoiceValue: 180000, discount: 0, balanceDue: 170000 },
      tx,
    );
    expect(mockedClientRepo.incReceivableBalance).toHaveBeenCalledWith(
      1,
      30000,
      tx,
    );
  });

  it("getSalesInvoiceDetail formats date and appends TOTAL row", async () => {
    mockedOrderRepo.getSalesInvoiceDetail.mockResolvedValueOnce({
      header: {
        invoice_number: "SJ-1",
        invoice_date: "2026-04-14",
        invoice_value: 50000,
        client_name: "Beta",
        client_city: "Jakarta",
      },
      lines: [
        { name: "A", qty: 1, unit: "pcs", price: 20000, total_price: 20000 },
        { name: "B", qty: 1, unit: "pcs", price: 30000, total_price: 30000 },
      ],
    } as never);

    const result = await saleService.getSalesInvoiceDetail("SJ-1");

    expect(result.header.invoice_date).toBe("14/04/2026");
    expect(result.lines).toHaveLength(3);
    expect(result.lines[2]).toEqual({
      name: "TOTAL",
      qty: null,
      unit: null,
      price: null,
      total_price: 50000,
    });
  });

  it("getSalesInvoiceDetail throws AppError when invoice is missing", async () => {
    mockedOrderRepo.getSalesInvoiceDetail.mockResolvedValueOnce({
      header: null,
      lines: [],
    } as never);

    await expect(saleService.getSalesInvoiceDetail("SJ-X")).rejects.toEqual(
      expect.objectContaining({
        message: "Invoice not found",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("getSaleReturnLines throws AppError when invoice is missing", async () => {
    mockedOrderRepo.getSaleReturnLinesWithMeta.mockResolvedValueOnce(
      null as never,
    );

    await expect(saleService.getSaleReturnLines("SJ-X")).rejects.toEqual(
      expect.objectContaining({
        message: "Invoice not found",
        statusCode: 404,
      }) as AppError,
    );
  });

  it("delegates query methods to repository", async () => {
    mockedOrderRepo.getOrdersMenu.mockResolvedValueOnce([{ id: 1 }] as never);
    mockedOrderRepo.getSalesInvoices.mockResolvedValueOnce([
      { invoice_number: "S" },
    ] as never);
    mockedOrderRepo.getReturnEligibleOrders.mockResolvedValueOnce([
      { id: 2 },
    ] as never);
    mockedOrderRepo.getLatestSoldItemsByClient.mockResolvedValueOnce([
      { name: "Cable" },
    ] as never);

    await expect(saleService.getOrdersMenu(1, true)).resolves.toEqual([
      { id: 1 },
    ]);
    await expect(saleService.getSalesInvoices("S")).resolves.toEqual([
      { invoice_number: "S" },
    ]);
    await expect(saleService.getReturnEligibleOrders(1)).resolves.toEqual([
      { id: 2 },
    ]);
    await expect(
      saleService.getLatestSoldItemsByClient(1, "C"),
    ).resolves.toEqual([{ name: "Cable" }]);
  });
});
