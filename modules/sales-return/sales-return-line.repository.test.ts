import db from "@/lib/drizzle";
import { salesReturnLineRepository } from "./sales-return-line.repository";

jest.mock("@/lib/drizzle", () => ({
  __esModule: true,
  default: {
    insert: jest.fn(),
    select: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedDb = db as unknown as {
  insert: jest.Mock;
  select: jest.Mock;
  delete: jest.Mock;
};

describe("salesReturnLineRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createSalesReturnLine maps total_price correctly", () => {
    const values = jest.fn().mockResolvedValue({});
    mockedDb.insert.mockReturnValue({ values });

    salesReturnLineRepository.createSalesReturnLine(
      [{ sales_order_line_id: 9, return_qty: 3, price: 12000 }],
      50,
    );

    expect(values).toHaveBeenCalledWith([
      {
        sales_return_id: 50,
        sales_order_line_id: 9,
        price: 12000,
        qty: 3,
        total_price: 36000,
      },
    ]);
  });

  it("getBySalesReturnIds returns [] early for empty ids", () => {
    const result = salesReturnLineRepository.getBySalesReturnIds([]);

    expect(result).toEqual([]);
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it("getBySalesReturnIds builds select chain for non-empty ids", () => {
    const where = jest.fn().mockResolvedValue([]);
    const innerJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ innerJoin });
    mockedDb.select.mockReturnValue({ from });

    salesReturnLineRepository.getBySalesReturnIds([1, 2]);

    expect(mockedDb.select).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledTimes(1);
    expect(innerJoin).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
  });

  it("deleteBySalesReturnIds returns early for empty ids", () => {
    const result = salesReturnLineRepository.deleteBySalesReturnIds([]);

    expect(result).toBeUndefined();
    expect(mockedDb.delete).not.toHaveBeenCalled();
  });

  it("deleteBySalesReturnIds executes delete chain for non-empty ids", () => {
    const where = jest.fn().mockResolvedValue({});
    mockedDb.delete.mockReturnValue({ where });

    salesReturnLineRepository.deleteBySalesReturnIds([8]);

    expect(mockedDb.delete).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
  });
});
