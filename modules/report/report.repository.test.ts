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

function selectChainWhere(result: unknown) {
  const chain = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue(result),
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
      .mockReturnValueOnce(selectChainWhere([{ value: 100 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 50 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 40 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 0 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 70 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 20 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 10 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 3 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 4 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 2 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 1 }]))
      .mockReturnValueOnce(selectChainWhere([{ value: 6 }]));

    mockedDb.execute
      .mockResolvedValueOnce([{ value: 5 }])
      .mockResolvedValueOnce([{ value: 2 }])
      .mockResolvedValueOnce([{ value: 3 }])
      .mockResolvedValueOnce([
        {
          title: "Sale invoice created",
          subtitle: "SJ-1 - Client",
          occurred_at: "2026-04-14T00:00:00.000Z",
        },
      ]);

    const snapshot = await reportRepository.getDashboardSnapshot();

    expect(snapshot.headline.todayRevenue).toEqual({
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
      occurredAt: "2026-04-14T00:00:00.000Z",
    });
  });

  it("getInventoryLedgers unions four queries and applies ordering", () => {
    const orderBy = jest.fn().mockReturnValue("ordered-result");
    mockedUnionAll.mockReturnValue({ orderBy });

    const queryStub = {
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue("query"),
      }),
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
    const orderBy = jest.fn().mockReturnValue("query-result");
    const groupBy = jest.fn().mockReturnValue({ orderBy });
    const leftJoin = jest.fn().mockReturnValue({ groupBy });
    const innerJoin = jest.fn().mockReturnValue({ leftJoin });
    const from = jest.fn().mockReturnValue({ innerJoin });
    mockedDb.select.mockReturnValue({ from });

    const result = reportRepository.getAllPayables();

    expect(mockedDb.select).toHaveBeenCalledTimes(1);
    expect(orderBy).toHaveBeenCalledTimes(1);
    expect(result).toBe("query-result");
  });

  it("getProfits executes raw SQL query", () => {
    mockedDb.execute.mockResolvedValueOnce([{ sales_name: "Rudi" }]);

    reportRepository.getProfits(4, 2026);

    expect(mockedDb.execute).toHaveBeenCalledTimes(1);
  });
});
