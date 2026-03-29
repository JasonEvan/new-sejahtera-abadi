import { PageTitle } from "@/components/shared/PageTitle";
import EditReceivablesContent from "./_components/EditReceivablesContent";

export default function EditReceivablesPage() {
  return (
    <div>
      <PageTitle
        title="Edit Pelunasan Piutang"
        subtitle="Kelola perubahan pelunasan piutang berdasarkan nomor nota"
      />
      <EditReceivablesContent />
    </div>
  );
}
