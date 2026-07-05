import db from "@/lib/drizzle";
import { reportRepository } from "./report.repository";
import { unionAll } from "drizzle-orm/pg-core";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    select: jest.fn(),
    execute: jest.fn(),
  },
}));

jest.mock("drizzle-orm/pg-core", () => {
  const actual = jest.requireActual("drizzle-orm/pg-core");
  return {
    ...actual,
    unionAll: jest.fn(),
  };
});

const mockedDb = db as unknown as {
  select: jest.Mock;
  execute: jest.Mock;
};
const mockedUnionAll = unionAll as unknown as jest.Mock;

function selectChainThen(result: unknown) {
  const chain = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    then: jest.fn((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback(result)),
    ),
  };

  return {
    from: jest.fn().mockReturnValue(chain),
  };
}

describe("report.repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getDashboardSnapshot maps db metrics to snapshot with delta percentages", async () => {
    mockedDb.select
      .mockReturnValueOnce(
        selectChainThen([
          {
            thisMonthOmzet: 100,
            prevMonthOmzet: 50,
            openReceivables: 70,
            todayOpenReceivables: 20,
            yesterdayOpenReceivables: 10,
            salesOrdersToday: 4,
            paidInvoicesThisWeek: 2,
            pendingReceivables: 1,
          },
        ]),
      )
      .mockReturnValueOnce(
        selectChainThen([
          {
            todayGrossProfit: 40,
            yesterdayGrossProfit: 0,
          },
        ]),
      );

    mockedDb.execute
      .mockResolvedValueOnce([{ active_30: 5, active_prev_30: 2 }])
      .mockResolvedValueOnce([
        {
          purchase_orders_today: 1,
          low_stock_alerts: 2,
          return_requests_this_month: 3,
        },
      ])
      .mockResolvedValueOnce([
        {
          title: "Sale invoice created",
          subtitle: "SJ-1 - Client",
          occurred_at: "2026-04-14T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          name: "Daniel",
          total_revenue: 1000,
        },
      ]);

    const snapshot = await reportRepository.getDashboardSnapshot();

    expect(snapshot.headline.thisMonthOmzet).toEqual({
      value: 100,
      deltaPercentage: 100,
    });
    expect(snapshot.headline.grossProfit).toEqual({
      value: 40,
      deltaPercentage: null,
    });
    expect(snapshot.headline.openReceivables).toEqual({
      value: 70,
      deltaPercentage: 100,
    });
    expect(snapshot.headline.activeClients).toEqual({
      value: 5,
      deltaPercentage: 150,
    });
    expect(snapshot.operational.returnRequestsThisMonth).toBe(3);
    expect(snapshot.recentActivity[0]).toEqual({
      title: "Sale invoice created",
      subtitle: "SJ-1 - Client",
      occurredAt: "2026-04-13T17:00:00.000Z", // Asia/Jakarta Time Zone
    });
    expect(snapshot.salespersonPerformance).toEqual([
      {
        name: "Daniel",
        totalRevenue: 1000,
      },
    ]);
  });

  it("getInventoryLedgers unions four queries and applies ordering", () => {
    const orderBy = jest.fn().mockReturnValue("ordered-result");
    mockedUnionAll.mockReturnValue({ orderBy });

    const chain = {
      innerJoin: jest.fn().mockReturnValue(undefined),
      leftJoin: jest.fn().mockReturnValue(undefined),
      where: jest.fn().mockReturnValue("query"),
    };
    chain.innerJoin.mockReturnValue(chain);
    chain.leftJoin.mockReturnValue(chain);

    const queryStub = {
      from: jest.fn().mockReturnValue(chain),
    };

    mockedDb.select
      .mockReturnValueOnce(queryStub)
      .mockReturnValueOnce(queryStub)
      .mockReturnValueOnce(queryStub)
      .mockReturnValueOnce(queryStub);

    const result = reportRepository.getInventoryLedgers(9);

    expect(mockedDb.select).toHaveBeenCalledTimes(4);
    expect(mockedUnionAll).toHaveBeenCalledTimes(1);
    expect(orderBy).toHaveBeenCalledTimes(1);
    expect(result).toBe("ordered-result");
  });

  it("getAllPayables returns ordered query chain", () => {
    const as = jest.fn().mockReturnValue("subquery");
    const orderBy = jest.fn().mockReturnValue("query-result");
    const groupBy = jest.fn().mockReturnValue({ as, orderBy });
    const chain: any = {
      innerJoin: jest.fn(),
      leftJoin: jest.fn(),
      groupBy,
      orderBy,
    };
    chain.innerJoin.mockReturnValue(chain);
    chain.leftJoin.mockReturnValue(chain);
    const from = jest.fn().mockReturnValue(chain);
    mockedDb.select.mockReturnValue({ from } as any);

    const result = reportRepository.getAllPayables();

    expect(mockedDb.select).toHaveBeenCalled();
    expect(result).toBe("query-result");
  });

  it("getProfits executes raw SQL query", () => {
    mockedDb.execute.mockResolvedValueOnce([{ sales_name: "Rudi" }]);

    reportRepository.getProfits(4, 2026);

    expect(mockedDb.execute).toHaveBeenCalledTimes(1);
  });
});
