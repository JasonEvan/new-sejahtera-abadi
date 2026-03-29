import { PageTitle } from "@/components/shared/PageTitle";
import EditPurchasesContent from "./_components/EditPurchasesContent";

export default function EditPurchasesPage() {
  return (
    <div>
      <PageTitle title="Edit Pembelian" subtitle="Edit nota pembelian" />
      <EditPurchasesContent />
    </div>
  );
}
