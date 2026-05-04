import { PageTitle } from "@/components/shared/PageTitle";
import CompanySettingsForm from "./_components/CompanySettingsForm";

export default function CompanySettingsPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Profil Perusahaan"
        subtitle="Atur nama dan alamat perusahaan yang akan muncul di nota dan laporan"
      />
      <div className="max-w-2xl">
        <CompanySettingsForm />
      </div>
    </div>
  );
}
