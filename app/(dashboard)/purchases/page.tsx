import { PageTitle } from "@/components/shared/PageTitle";
import PurchasesContent from "./_components/PurchasesContent";

export default function PurchasesPage() {
  return (
    <div>
      <PageTitle title="Pembelian" subtitle="Buat nota pembelian" />
      <PurchasesContent />
    </div>
  );
}
