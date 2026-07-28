import { PageTitle } from "@/components/shared/PageTitle";
import EditPayablesContent from "./_components/EditPayablesContent";

export default function EditPayablesPage() {
  return (
    <div>
      <PageTitle
        title="Edit Pelunasan Utang"
        subtitle="Kelola perubahan pelunasan utang berdasarkan nomor transaksi"
      />
      <EditPayablesContent />
    </div>
  );
}
