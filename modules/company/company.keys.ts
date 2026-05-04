export const companyKeys = {
  all: ["company"] as const,
  settings: () => [...companyKeys.all, "settings"] as const,
};
