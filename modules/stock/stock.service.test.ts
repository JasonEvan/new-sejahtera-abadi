import { stockRepository } from "./stock.repository";
import { stockService } from "./stock.service";

jest.mock("./stock.repository", () => ({
  stockRepository: {
    getAllStocks: jest.fn(),
    addStock: jest.fn(),
    updateStock: jest.fn(),
    deleteStock: jest.fn(),
    getStockById: jest.fn(),
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

  it("deleteStock should throw error if stock not found", async () => {
    mockedRepository.getStockById.mockResolvedValueOnce(undefined as never);

    await expect(stockService.deleteStock(1)).rejects.toThrow(
      "Data stok tidak ditemukan",
    );
  });

  it("deleteStock should throw error if initial_stock is not 0", async () => {
    mockedRepository.getStockById.mockResolvedValueOnce({
      initial_stock: 10,
      ending_stock: 0,
      qty_in: 0,
      qty_out: 0,
    } as never);

    await expect(stockService.deleteStock(1)).rejects.toThrow(
      "Stok awal dan stok akhir harus 0",
    );
  });

  it("deleteStock should throw error if qty_in is not 0", async () => {
    mockedRepository.getStockById.mockResolvedValueOnce({
      initial_stock: 0,
      ending_stock: 0,
      qty_in: 5,
      qty_out: 0,
    } as never);

    await expect(stockService.deleteStock(1)).rejects.toThrow(
      "Barang masuk dan barang keluar harus 0",
    );
  });

  it("deleteStock should call repository.deleteStock if validation passes", async () => {
    mockedRepository.getStockById.mockResolvedValueOnce({
      initial_stock: 0,
      ending_stock: 0,
      qty_in: 0,
      qty_out: 0,
    } as never);
    mockedRepository.deleteStock.mockResolvedValueOnce({ rowCount: 1 } as never);

    const result = await stockService.deleteStock(1);

    expect(mockedRepository.deleteStock).toHaveBeenCalledWith(1);
    expect(result).toEqual({ rowCount: 1 });
  });

  it("should propagate repository errors for stock service methods", async () => {
    const err = new Error("db failed");
    mockedRepository.getAllStocks.mockRejectedValueOnce(err);

    await expect(stockService.getAllStocks()).rejects.toThrow("db failed");
    expect(mockedRepository.getAllStocks).toHaveBeenCalledTimes(1);
  });
});
