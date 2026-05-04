import api from "@/lib/axios";
import { CompanySettings, UpdateCompanySettingsInput } from "./company.types";

export const companyApi = {
  async getSettings() {
    const { data } = await api.get<CompanySettings>("/company");
    return data;
  },
  async updateSettings(input: UpdateCompanySettingsInput) {
    const { data } = await api.patch<CompanySettings>("/company", input);
    return data;
  },
};
