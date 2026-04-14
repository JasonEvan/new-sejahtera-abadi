import db from "@/lib/drizzle";
import { purchaseReturnLineRepository } from "./purchase-return-line.repository";

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

describe("purchaseReturnLineRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createPurchaseReturnLine maps total_price correctly", () => {
    const values = jest.fn().mockResolvedValue({});
    mockedDb.insert.mockReturnValue({ values });

    purchaseReturnLineRepository.createPurchaseReturnLine(
      [{ purchase_order_line_id: 9, return_qty: 2, price: 15000 }],
      20,
    );

    expect(values).toHaveBeenCalledWith([
      {
        purchase_return_id: 20,
        purchase_order_line_id: 9,
        price: 15000,
        qty: 2,
        total_price: 30000,
      },
    ]);
  });

  it("getByPurchaseReturnIds returns [] early for empty ids", () => {
    const result = purchaseReturnLineRepository.getByPurchaseReturnIds([]);

    expect(result).toEqual([]);
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it("getByPurchaseReturnIds builds select chain for non-empty ids", () => {
    const where = jest.fn().mockResolvedValue([]);
    const innerJoin = jest.fn().mockReturnValue({ where });
    const from = jest.fn().mockReturnValue({ innerJoin });
    mockedDb.select.mockReturnValue({ from });

    purchaseReturnLineRepository.getByPurchaseReturnIds([1, 2]);

    expect(mockedDb.select).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledTimes(1);
    expect(innerJoin).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
  });

  it("deleteByPurchaseReturnIds returns early for empty ids", () => {
    const result = purchaseReturnLineRepository.deleteByPurchaseReturnIds([]);

    expect(result).toBeUndefined();
    expect(mockedDb.delete).not.toHaveBeenCalled();
  });

  it("deleteByPurchaseReturnIds executes delete chain for non-empty ids", () => {
    const where = jest.fn().mockResolvedValue({});
    mockedDb.delete.mockReturnValue({ where });

    purchaseReturnLineRepository.deleteByPurchaseReturnIds([88]);

    expect(mockedDb.delete).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
  });
});
