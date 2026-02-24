import { PageTitle } from "@/components/shared/PageTitle";
import ClientTable from "./_components/ClientTable";

export default function ClientsPage() {
  return (
    <div>
      <PageTitle title="Client" subtitle="Kelola customer dan supplier" />
      <ClientTable />
    </div>
  );
}
