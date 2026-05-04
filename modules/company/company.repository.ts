import { company_settings } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { UpdateCompanySettingsInput } from "./company.types";

export const companyRepository = {
  async getSettings() {
    const settings = await db.select().from(company_settings).limit(1);
    if (settings.length === 0) {
      // Initialize if not exists
      const [newSettings] = await db
        .insert(company_settings)
        .values({
          name: "Sejahtera Abadi",
          address: "",
          timezone: "Asia/Jakarta",
        })
        .returning();
      return newSettings;
    }
    return settings[0];
  },

  async updateSettings(input: UpdateCompanySettingsInput) {
    const current = await this.getSettings();
    const [updated] = await db
      .update(company_settings)
      .set(input)
      .where(eq(company_settings.id, current.id))
      .returning();
    return updated;
  },
};
