import { PageTitle } from "@/components/shared/PageTitle";
import InventoryLedgerContent from "./_components/InventoryLedgerContent";

export default function InventoryLedgerPage() {
  return (
    <div>
      <PageTitle
        title="Kartu Persediaan"
        subtitle="Lihat daftar kartu persediaan bulan tertentu"
      />
      <InventoryLedgerContent />
    </div>
  );
}
