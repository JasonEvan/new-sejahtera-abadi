import api from "@/lib/axios";
import { addStock, deleteStock, getAllStocks, updateStock } from "./stock.api";

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

describe("stock.api CRUD", () => {
  const payload = {
    name: "Steel Rod",
    product_price: 1000,
    selling_price: 1200,
    unit: "pcs",
    capital_cost: 1000,
    initial_stock: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllStocks should call GET /stocks and return response.data", async () => {
    const apiData = { data: [{ id: 1, name: "Steel Rod" }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getAllStocks();

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/stocks");
    expect(result).toEqual(apiData);
  });

  it("addStock should call POST /stocks with payload and return response.data", async () => {
    const apiData = { message: "Stock added" };
    mockedApi.post.mockResolvedValueOnce({ data: apiData } as never);

    const result = await addStock(payload as never);

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith("/stocks", payload);
    expect(result).toEqual(apiData);
  });

  it("updateStock should call PUT /stocks/:id with payload and return response.data", async () => {
    const apiData = { message: "Stock updated" };
    mockedApi.put.mockResolvedValueOnce({ data: apiData } as never);

    const result = await updateStock({ id: 7, data: payload as never });

    expect(mockedApi.put).toHaveBeenCalledTimes(1);
    expect(mockedApi.put).toHaveBeenCalledWith("/stocks/7", payload);
    expect(result).toEqual(apiData);
  });

  it("deleteStock should call DELETE /stocks/:id and return response.data", async () => {
    const apiData = { message: "Stock deleted" };
    mockedApi.delete.mockResolvedValueOnce({ data: apiData } as never);

    const result = await deleteStock(2);

    expect(mockedApi.delete).toHaveBeenCalledTimes(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/stocks/2");
    expect(result).toEqual(apiData);
  });

  it("should propagate API errors for stock requests", async () => {
    const err = new Error("request failed");
    mockedApi.post.mockRejectedValueOnce(err);

    await expect(addStock(payload as never)).rejects.toThrow("request failed");
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
  });
});
