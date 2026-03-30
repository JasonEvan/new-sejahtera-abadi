import { PageTitle } from "@/components/shared/PageTitle";
import EditSaleReturnContent from "./_components/EditSaleReturnContent";

export default function EditSaleReturnPage() {
  return (
    <div>
      <PageTitle
        title="Edit Retur Jual"
        subtitle="Edit transaksi retur penjualan"
      />
      <EditSaleReturnContent />
    </div>
  );
}
