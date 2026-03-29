import { PageTitle } from "@/components/shared/PageTitle";
import EditSalesContent from "./_components/EditSalesContent";

export default function EditSalesPage() {
  return (
    <div>
      <PageTitle title="Edit Penjualan" subtitle="Edit nota penjualan" />
      <EditSalesContent />
    </div>
  );
}
