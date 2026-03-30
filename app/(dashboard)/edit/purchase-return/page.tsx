import { PageTitle } from "@/components/shared/PageTitle";
import EditPurchaseReturnContent from "./_components/EditPurchaseReturnContent";

export default function EditPurchaseReturnPage() {
  return (
    <div>
      <PageTitle
        title="Edit Retur Beli"
        subtitle="Edit transaksi retur pembelian"
      />
      <EditPurchaseReturnContent />
    </div>
  );
}
