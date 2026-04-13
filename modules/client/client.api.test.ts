import api from "@/lib/axios";
import {
  addClient,
  deleteClient,
  editClient,
  getClientNames,
  getClients,
} from "./client.api";

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

describe("client.api CRUD", () => {
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

  it("getClients should call GET /clients and return response.data", async () => {
    const apiData = { data: [{ id: 1, name: "ACME" }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getClients();

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/clients");
    expect(result).toEqual(apiData);
  });

  it("getClientNames should call GET /clients?nameOnly=true and return response.data", async () => {
    const apiData = { data: [{ id: 1, name: "ACME", city: "Bandung" }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getClientNames();

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/clients?nameOnly=true");
    expect(result).toEqual(apiData);
  });

  it("addClient should call POST /clients with payload and return response.data", async () => {
    const apiData = { message: "Client added" };
    mockedApi.post.mockResolvedValueOnce({ data: apiData } as never);

    const result = await addClient(payload as never);

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith("/clients", payload);
    expect(result).toEqual(apiData);
  });

  it("editClient should call PUT /clients/:id with payload and return response.data", async () => {
    const apiData = { message: "Client updated" };
    mockedApi.put.mockResolvedValueOnce({ data: apiData } as never);

    const result = await editClient({ id: 9, data: payload as never });

    expect(mockedApi.put).toHaveBeenCalledTimes(1);
    expect(mockedApi.put).toHaveBeenCalledWith("/clients/9", payload);
    expect(result).toEqual(apiData);
  });

  it("deleteClient should call DELETE /clients/:id and return response.data", async () => {
    const apiData = { message: "Client deleted" };
    mockedApi.delete.mockResolvedValueOnce({ data: apiData } as never);

    const result = await deleteClient(5);

    expect(mockedApi.delete).toHaveBeenCalledTimes(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/clients/5");
    expect(result).toEqual(apiData);
  });

  it("should propagate API errors for client requests", async () => {
    const err = new Error("request failed");
    mockedApi.get.mockRejectedValueOnce(err);

    await expect(getClients()).rejects.toThrow("request failed");
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
