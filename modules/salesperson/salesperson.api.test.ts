import api from "@/lib/axios";
import {
  addSalesperson,
  deleteSalesperson,
  editSalesperson,
  getSalespersonNames,
  getSalespersons,
} from "./salesperson.api";

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

describe("salesperson.api CRUD", () => {
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

  it("getSalespersons should call GET /salespersons and return response.data", async () => {
    const apiData = { data: [{ id: 1, name: "Budi" }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getSalespersons();

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/salespersons");
    expect(result).toEqual(apiData);
  });

  it("getSalespersonNames should call GET /salespersons?nameOnly=true and return response.data", async () => {
    const apiData = { data: [{ id: 1, name: "Budi", invoice_number: 2 }] };
    mockedApi.get.mockResolvedValueOnce({ data: apiData } as never);

    const result = await getSalespersonNames();

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/salespersons?nameOnly=true");
    expect(result).toEqual(apiData);
  });

  it("addSalesperson should call POST /salespersons with payload and return response.data", async () => {
    const apiData = { message: "Salesperson added" };
    mockedApi.post.mockResolvedValueOnce({ data: apiData } as never);

    const result = await addSalesperson(addPayload as never);

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith("/salespersons", addPayload);
    expect(result).toEqual(apiData);
  });

  it("editSalesperson should call PUT /salespersons/:id with payload and return response.data", async () => {
    const apiData = { message: "Salesperson updated" };
    mockedApi.put.mockResolvedValueOnce({ data: apiData } as never);

    const result = await editSalesperson({ id: 4, data: editPayload as never });

    expect(mockedApi.put).toHaveBeenCalledTimes(1);
    expect(mockedApi.put).toHaveBeenCalledWith("/salespersons/4", editPayload);
    expect(result).toEqual(apiData);
  });

  it("deleteSalesperson should call DELETE /salespersons/:id and return response.data", async () => {
    const apiData = { message: "Salesperson deleted" };
    mockedApi.delete.mockResolvedValueOnce({ data: apiData } as never);

    const result = await deleteSalesperson(4);

    expect(mockedApi.delete).toHaveBeenCalledTimes(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/salespersons/4");
    expect(result).toEqual(apiData);
  });

  it("should propagate API errors for salesperson requests", async () => {
    const err = new Error("request failed");
    mockedApi.put.mockRejectedValueOnce(err);

    await expect(
      editSalesperson({ id: 1, data: editPayload as never }),
    ).rejects.toThrow("request failed");
    expect(mockedApi.put).toHaveBeenCalledTimes(1);
  });
});
