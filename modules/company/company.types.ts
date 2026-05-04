export type CompanySettings = {
  id: number;
  name: string;
  address: string;
  timezone: string;
};

export type UpdateCompanySettingsInput = Omit<CompanySettings, "id">;
