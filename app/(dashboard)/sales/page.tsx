import { PageTitle } from "@/components/shared/PageTitle";
import SalesContent from "./_components/SalesContent";

export default function SalesPage() {
  return (
    <div>
      <PageTitle title="Penjualan" subtitle="Buat nota penjualan" />
      <SalesContent />
    </div>
  );
}
