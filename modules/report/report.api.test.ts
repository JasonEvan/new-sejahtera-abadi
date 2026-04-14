import api from "@/lib/axios";
import {
  getAllPayables,
  getAllReceivables,
  getDashboardSnapshot,
  getInventoryLedgers,
  getPayablesByClient,
  getProfitReport,
  getReceivablesByClient,
} from "./report.api";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe("report.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getInventoryLedgers calls reports endpoint with stock_id", async () => {
    const apiData = { data: [] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getInventoryLedgers(9);

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/reports/inventory-ledgers?stock_id=9",
    );
    expect(result).toEqual(apiData);
  });

  it("getAllPayables and getAllReceivables call fixed endpoints", async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { data: [] } } as never)
      .mockResolvedValueOnce({ data: { data: [] } } as never);

    await getAllPayables();
    await getAllReceivables();

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, "/purchase-payments");
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, "/sales-payments");
  });

  it("client-scoped report APIs include client_id in query", async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { data: [] } } as never)
      .mockResolvedValueOnce({ data: { data: [] } } as never);

    await getPayablesByClient(3);
    await getReceivablesByClient(4);

    expect(mockedApi.get).toHaveBeenNthCalledWith(
      1,
      "/reports/payables-per-client?client_id=3",
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      "/reports/receivables-per-client?client_id=4",
    );
  });

  it("getProfitReport serializes month and year in query", async () => {
    const apiData = { data: [] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getProfitReport(4, 2026);

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/reports/profits?month=4&year=2026",
    );
    expect(result).toEqual(apiData);
  });

  it("getDashboardSnapshot calls dashboard endpoint", async () => {
    const apiData = {
      data: { headline: {}, operational: {}, recentActivity: [] },
    };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getDashboardSnapshot();

    expect(mockedApi.get).toHaveBeenCalledWith("/reports/dashboard");
    expect(result).toEqual(apiData);
  });

  it("propagates API failure", async () => {
    mockedApi.get.mockRejectedValueOnce(new Error("network"));

    await expect(getDashboardSnapshot()).rejects.toThrow("network");
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
