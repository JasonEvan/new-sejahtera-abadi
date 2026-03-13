import { PageTitle } from "@/components/shared/PageTitle";
import SaleReturnContent from "./_components/SaleReturnContent";

export default function SalesReturnPage() {
  return (
    <div>
      <PageTitle title="Retur Jual" subtitle="Buat retur penjualan" />
      <SaleReturnContent />
    </div>
  );
}
