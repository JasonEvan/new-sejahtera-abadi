import { companyRepository } from "./company.repository";
import { UpdateCompanySettingsInput } from "./company.types";

export const companyService = {
  getSettings() {
    return companyRepository.getSettings();
  },

  updateSettings(input: UpdateCompanySettingsInput) {
    return companyRepository.updateSettings(input);
  },
};
