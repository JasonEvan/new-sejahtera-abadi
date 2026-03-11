import { PageTitle } from "@/components/shared/PageTitle";
import ReceivablesPerClientContent from "./_components/ReceivablesPerClientContent";

export default function ReceivablesPerClientPage() {
  return (
    <div>
      <PageTitle
        title="Piutang per Client"
        subtitle="Lihat semua piutang berdasarkan client di sini"
      />
      <ReceivablesPerClientContent />
    </div>
  );
}
