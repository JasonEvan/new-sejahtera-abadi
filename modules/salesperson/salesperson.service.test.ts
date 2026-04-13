import { salespersonRepository } from "./salesperson.repository";
import { salespersonService } from "./salesperson.service";

jest.mock("./salesperson.repository", () => ({
  salespersonRepository: {
    getSalespersons: jest.fn(),
    getSalespersonNames: jest.fn(),
    addSalesperson: jest.fn(),
    updateSalesperson: jest.fn(),
    deleteSalesperson: jest.fn(),
  },
}));

const mockedRepository = salespersonRepository as jest.Mocked<
  typeof salespersonRepository
>;

describe("salesperson.service CRUD", () => {
  const addPayload = {
    name: "Budi",
    front_number: "SP",
  };

  const editPayload = {
    name: "Budi Updated",
    front_number: "SP",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getSalespersons() should default to full list and not call getSalespersonNames()", async () => {
    const expected = [{ id: 1, name: "Budi" }];
    mockedRepository.getSalespersons.mockResolvedValueOnce(expected as never);

    const result = await salespersonService.getSalespersons();

    expect(mockedRepository.getSalespersons).toHaveBeenCalledTimes(1);
    expect(mockedRepository.getSalespersonNames).not.toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("getSalespersons(true) should call getSalespersonNames() and not call getSalespersons()", async () => {
    const expected = [{ id: 1, name: "Budi", invoice_number: 1 }];
    mockedRepository.getSalespersonNames.mockResolvedValueOnce(
      expected as never,
    );

    const result = await salespersonService.getSalespersons(true);

    expect(mockedRepository.getSalespersonNames).toHaveBeenCalledTimes(1);
    expect(mockedRepository.getSalespersons).not.toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("addSalesperson should pass payload as-is to repository", async () => {
    const expected = { rowCount: 1 };
    mockedRepository.addSalesperson.mockResolvedValueOnce(expected as never);

    const result = await salespersonService.addSalesperson(addPayload as never);

    expect(mockedRepository.addSalesperson).toHaveBeenCalledTimes(1);
    expect(mockedRepository.addSalesperson).toHaveBeenCalledWith(addPayload);
    expect(result).toEqual(expected);
  });

  it("updateSalesperson should pass id and payload as-is to repository", async () => {
    const expected = { rowCount: 1 };
    mockedRepository.updateSalesperson.mockResolvedValueOnce(expected as never);

    const result = await salespersonService.updateSalesperson(
      4,
      editPayload as never,
    );

    expect(mockedRepository.updateSalesperson).toHaveBeenCalledTimes(1);
    expect(mockedRepository.updateSalesperson).toHaveBeenCalledWith(
      4,
      editPayload,
    );
    expect(result).toEqual(expected);
  });

  it("deleteSalesperson should pass id as-is to repository", async () => {
    const expected = { rowCount: 1 };
    mockedRepository.deleteSalesperson.mockResolvedValueOnce(expected as never);

    const result = await salespersonService.deleteSalesperson(4);

    expect(mockedRepository.deleteSalesperson).toHaveBeenCalledTimes(1);
    expect(mockedRepository.deleteSalesperson).toHaveBeenCalledWith(4);
    expect(result).toEqual(expected);
  });

  it("should propagate repository errors for salesperson service methods", async () => {
    const err = new Error("db failed");
    mockedRepository.addSalesperson.mockRejectedValueOnce(err);

    await expect(
      salespersonService.addSalesperson(addPayload as never),
    ).rejects.toThrow("db failed");
    expect(mockedRepository.addSalesperson).toHaveBeenCalledTimes(1);
  });
});
