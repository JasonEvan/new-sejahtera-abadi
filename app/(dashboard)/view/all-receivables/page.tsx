import { PageTitle } from "@/components/shared/PageTitle";
import AllReceivablesTable from "./_components/AllReceivablesTable";

export default function AllReceivablesPage() {
  return (
    <div>
      <PageTitle
        title="Semua Piutang"
        subtitle="Lihat semua piutang yang telah dibuat di sini"
      />
      <AllReceivablesTable />
    </div>
  );
}
