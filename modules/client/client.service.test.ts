import { clientRepository } from "./client.repository";
import { clientService } from "./client.service";

jest.mock("./client.repository", () => ({
  clientRepository: {
    getClients: jest.fn(),
    getNames: jest.fn(),
    addClient: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
  },
}));

const mockedRepository = clientRepository as jest.Mocked<
  typeof clientRepository
>;

describe("client.service CRUD", () => {
  const payload = {
    name: "ACME",
    city: "Bandung",
    address: "Jl. Mawar 1",
    phone: "0220000",
    mobile_phone: "081234",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getClients() should default to full list and not call getNames()", async () => {
    const expected = [{ id: 1, name: "ACME" }];
    mockedRepository.getClients.mockResolvedValueOnce(expected as never);

    const result = await clientService.getClients();

    expect(mockedRepository.getClients).toHaveBeenCalledTimes(1);
    expect(mockedRepository.getNames).not.toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("getClients(true) should call getNames() and not call getClients()", async () => {
    const expected = [{ id: 1, name: "ACME", city: "Bandung" }];
    mockedRepository.getNames.mockResolvedValueOnce(expected as never);

    const result = await clientService.getClients(true);

    expect(mockedRepository.getNames).toHaveBeenCalledTimes(1);
    expect(mockedRepository.getClients).not.toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("addClient should pass payload as-is to repository", async () => {
    const expected = { rowCount: 1 };
    mockedRepository.addClient.mockResolvedValueOnce(expected as never);

    const result = await clientService.addClient(payload as never);

    expect(mockedRepository.addClient).toHaveBeenCalledTimes(1);
    expect(mockedRepository.addClient).toHaveBeenCalledWith(payload);
    expect(result).toEqual(expected);
  });

  it("updateClient should pass id and payload as-is to repository", async () => {
    const expected = { rowCount: 1 };
    mockedRepository.updateClient.mockResolvedValueOnce(expected as never);

    const result = await clientService.updateClient(10, payload as never);

    expect(mockedRepository.updateClient).toHaveBeenCalledTimes(1);
    expect(mockedRepository.updateClient).toHaveBeenCalledWith(10, payload);
    expect(result).toEqual(expected);
  });

  it("deleteClient should pass id as-is to repository", async () => {
    const expected = { rowCount: 1 };
    mockedRepository.deleteClient.mockResolvedValueOnce(expected as never);

    const result = await clientService.deleteClient(10);

    expect(mockedRepository.deleteClient).toHaveBeenCalledTimes(1);
    expect(mockedRepository.deleteClient).toHaveBeenCalledWith(10);
    expect(result).toEqual(expected);
  });

  it("should propagate repository errors for client service methods", async () => {
    const err = new Error("db failed");
    mockedRepository.updateClient.mockRejectedValueOnce(err);

    await expect(
      clientService.updateClient(1, payload as never),
    ).rejects.toThrow("db failed");
    expect(mockedRepository.updateClient).toHaveBeenCalledTimes(1);
  });
});
