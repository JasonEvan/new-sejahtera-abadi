import { stockRepository } from "./stock.repository";
import { stockService } from "./stock.service";

jest.mock("./stock.repository", () => ({
  stockRepository: {
    getAllStocks: jest.fn(),
    addStock: jest.fn(),
    updateStock: jest.fn(),
    deleteStock: jest.fn(),
  },
}));

const mockedRepository = stockRepository as jest.Mocked<typeof stockRepository>;

describe("stock.service CRUD", () => {
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

  it("getAllStocks should delegate to repository and return data", async () => {
    const expected = [{ id: 1, name: "Steel Rod" }];
    mockedRepository.getAllStocks.mockResolvedValueOnce(expected as never);

    const result = await stockService.getAllStocks();

    expect(mockedRepository.getAllStocks).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expected);
  });

  it("addStock should pass payload as-is to repository", async () => {
    const expected = { rowCount: 1 };
    mockedRepository.addStock.mockResolvedValueOnce(expected as never);

    const result = await stockService.addStock(payload as never);

    expect(mockedRepository.addStock).toHaveBeenCalledTimes(1);
    expect(mockedRepository.addStock).toHaveBeenCalledWith(payload);
    expect(result).toEqual(expected);
  });

  it("updateStock should pass id and payload as-is to repository", async () => {
    const expected = { rowCount: 1 };
    mockedRepository.updateStock.mockResolvedValueOnce(expected as never);

    const result = await stockService.updateStock(2, payload as never);

    expect(mockedRepository.updateStock).toHaveBeenCalledTimes(1);
    expect(mockedRepository.updateStock).toHaveBeenCalledWith(2, payload);
    expect(result).toEqual(expected);
  });

  it("deleteStock should pass id as-is to repository", async () => {
    const expected = { rowCount: 1 };
    mockedRepository.deleteStock.mockResolvedValueOnce(expected as never);

    const result = await stockService.deleteStock(2);

    expect(mockedRepository.deleteStock).toHaveBeenCalledTimes(1);
    expect(mockedRepository.deleteStock).toHaveBeenCalledWith(2);
    expect(result).toEqual(expected);
  });

  it("should propagate repository errors for stock service methods", async () => {
    const err = new Error("db failed");
    mockedRepository.deleteStock.mockRejectedValueOnce(err);

    await expect(stockService.deleteStock(99)).rejects.toThrow("db failed");
    expect(mockedRepository.deleteStock).toHaveBeenCalledTimes(1);
  });
});
