import { stockRepository } from "../stock/stock.repository";
import { reportRepository } from "./report.repository";
import { reportService } from "./report.service";

jest.mock("./report.repository", () => ({
  reportRepository: {
    getDashboardSnapshot: jest.fn(),
    getInventoryLedgers: jest.fn(),
    getAllPayables: jest.fn(),
    getPayablesByClient: jest.fn(),
    getAllReceivables: jest.fn(),
    getReceivablesByClient: jest.fn(),
    getProfits: jest.fn(),
  },
}));

jest.mock("../stock/stock.repository", () => ({
  stockRepository: {
    getStartingStock: jest.fn(),
  },
}));

const mockedReportRepo = reportRepository as jest.Mocked<
  typeof reportRepository
>;
const mockedStockRepo = stockRepository as jest.Mocked<typeof stockRepository>;

describe("report.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getDashboardSnapshot proxies repository response", async () => {
    const snapshot = {
      headline: {
        todayRevenue: { value: 1, deltaPercentage: 0 },
        grossProfit: { value: 2, deltaPercentage: 10 },
        openReceivables: { value: 3, deltaPercentage: -5 },
        activeClients: { value: 4, deltaPercentage: null },
      },
      operational: {
        salesOrdersToday: 1,
        purchaseOrdersToday: 2,
        lowStockAlerts: 3,
        paidInvoicesThisWeek: 4,
        pendingReceivables: 5,
        returnRequestsThisMonth: 6,
      },
      recentActivity: [],
    };
    mockedReportRepo.getDashboardSnapshot.mockResolvedValueOnce(
      snapshot as never,
    );

    await expect(reportService.getDashboardSnapshot()).resolves.toEqual(
      snapshot,
    );
  });

  it("getInventoryLedgers computes running stock and totals for B/J/JR/BR", async () => {
    mockedStockRepo.getStartingStock.mockResolvedValueOnce([
      { initial_stock: 10 },
    ] as never);
    mockedReportRepo.getInventoryLedgers.mockResolvedValueOnce([
      {
        invoice_number: "PB-1",
        invoice_date: "2026-04-01",
        name: "Supplier",
        city: "Bandung",
        type: "B",
        price: 1000,
        qty: 5,
      },
      {
        invoice_number: "SJ-1",
        invoice_date: "2026-04-02",
        name: "Client",
        city: "Jakarta",
        type: "J",
        price: 1200,
        qty: 3,
      },
      {
        invoice_number: "SJ-1",
        invoice_date: "2026-04-03",
        name: "Client",
        city: "Jakarta",
        type: "JR",
        price: 1200,
        qty: 2,
      },
      {
        invoice_number: "PB-1",
        invoice_date: "2026-04-04",
        name: "Supplier",
        city: "Bandung",
        type: "BR",
        price: 1000,
        qty: 1,
      },
    ] as never);

    const rows = await reportService.getInventoryLedgers(5);

    expect(rows[0]).toEqual(
      expect.objectContaining({ name: "SALDO AWAL", final_qty: 10 }),
    );
    expect(rows[1]).toEqual(
      expect.objectContaining({
        type: "B",
        qty_in: 5,
        qty_out: null,
        final_qty: 15,
      }),
    );
    expect(rows[2]).toEqual(
      expect.objectContaining({
        type: "J",
        qty_in: null,
        qty_out: 3,
        final_qty: 12,
      }),
    );
    expect(rows[3]).toEqual(
      expect.objectContaining({
        type: "JR",
        qty_in: 2,
        qty_out: null,
        final_qty: 14,
      }),
    );
    expect(rows[4]).toEqual(
      expect.objectContaining({
        type: "BR",
        qty_in: null,
        qty_out: 1,
        final_qty: 13,
      }),
    );
    expect(rows[5]).toEqual(
      expect.objectContaining({
        name: "TOTAL QTY",
        qty_in: 7,
        qty_out: 4,
        final_qty: 13,
      }),
    );
  });

  it("getAllPayables formats dates and appends TOTAL summary row", async () => {
    mockedReportRepo.getAllPayables.mockResolvedValueOnce([
      {
        name: "A",
        city: "X",
        invoice_number: "PB-1",
        invoice_date: "2026-04-01",
        invoice_value: 100,
        paid_amount: 20,
        payment_date: "2026-04-03",
        balance_due: 80,
      },
      {
        name: "B",
        city: "Y",
        invoice_number: "PB-2",
        invoice_date: "2026-04-02",
        invoice_value: 50,
        paid_amount: 50,
        payment_date: null,
        balance_due: 0,
      },
    ] as never);

    const rows = await reportService.getAllPayables();

    expect(rows).toHaveLength(3);
    expect(rows[0].invoice_date).toBe("01/04/2026");
    expect(rows[0].payment_date).toBe("03/04/2026");
    expect(rows[2]).toEqual({
      name: "",
      city: "",
      invoice_number: "TOTAL",
      invoice_date: null,
      invoice_value: 150,
      paid_amount: 70,
      payment_date: null,
      balance_due: 80,
    });
  });

  it("getReceivablesByClient formats date and appends TOTAL", async () => {
    mockedReportRepo.getReceivablesByClient.mockResolvedValueOnce([
      {
        invoice_number: "SJ-1",
        invoice_date: "2026-04-05",
        invoice_value: 200,
        paid_amount: 10,
        payment_date: null,
        balance_due: 190,
      },
    ] as never);

    const rows = await reportService.getReceivablesByClient(1);

    expect(rows).toEqual([
      {
        invoice_number: "SJ-1",
        invoice_date: "05/04/2026",
        invoice_value: 200,
        paid_amount: 10,
        payment_date: null,
        balance_due: 190,
      },
      {
        invoice_number: "TOTAL",
        invoice_date: null,
        invoice_value: 200,
        paid_amount: 10,
        payment_date: null,
        balance_due: 190,
      },
    ]);
  });

  it("getProfits groups by salesperson and computes total sections and grand total", async () => {
    mockedReportRepo.getProfits.mockResolvedValueOnce([
      {
        sales_name: "Rudi",
        invoice_number: "SJ-1",
        invoice_date: new Date("2026-04-01"),
        client_name: "A",
        client_city: "X",
        invoice_value: 100,
        invoice_profit: 20,
      },
      {
        sales_name: "Rudi",
        invoice_number: "SJ-2",
        invoice_date: new Date("2026-04-02"),
        client_name: "B",
        client_city: "Y",
        invoice_value: 200,
        invoice_profit: 30,
      },
      {
        sales_name: "Sari",
        invoice_number: "SJ-3",
        invoice_date: new Date("2026-04-03"),
        client_name: "C",
        client_city: "Z",
        invoice_value: 50,
        invoice_profit: 10,
      },
    ] as never);

    const rows = await reportService.getProfits(4, 2026);

    expect(rows[0]).toEqual(
      expect.objectContaining({ invoice_number: "Rudi", invoice_value: null }),
    );
    expect(rows).toContainEqual(
      expect.objectContaining({ invoice_number: "TOTAL", invoice_profit: 50 }),
    );
    expect(rows).toContainEqual(
      expect.objectContaining({ invoice_number: "TOTAL", invoice_profit: 10 }),
    );
    expect(rows[rows.length - 1]).toEqual(
      expect.objectContaining({
        invoice_date: "GRAND TOTAL",
        invoice_profit: 60,
      }),
    );
  });
});
