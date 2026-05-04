export type CompanySettings = {
  id: number;
  name: string;
  address: string;
};

export type UpdateCompanySettingsInput = Omit<CompanySettings, "id">;
