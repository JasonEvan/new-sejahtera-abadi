import { PageTitle } from "@/components/shared/PageTitle";
import AllPayablesTable from "./_components/AllPayablesTable";

export default function AllPayablesPage() {
  return (
    <div>
      <PageTitle
        title="Semua Utang"
        subtitle="Lihat semua utang yang telah dibuat di sini"
      />
      <AllPayablesTable />
    </div>
  );
}
