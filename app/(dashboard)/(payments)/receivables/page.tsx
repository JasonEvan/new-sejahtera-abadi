import { PageTitle } from "@/components/shared/PageTitle";
import ReceivablesContent from "./_components/ReceivablesContent";

export default function ReceivablesPage() {
  return (
    <div>
      <PageTitle
        title="Pelunasan Piutang"
        subtitle="Kelola pelunasan piutang client"
      />
      <ReceivablesContent />
    </div>
  );
}
