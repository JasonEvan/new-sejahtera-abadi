import { PageTitle } from "@/components/shared/PageTitle";
import PayablesPerClientContent from "./_components/PayablesPerClientContent";

export default function PayablesPerClientPage() {
  return (
    <div>
      <PageTitle
        title="Utang per Client"
        subtitle="Lihat semua utang berdasarkan client di sini"
      />
      <PayablesPerClientContent />
    </div>
  );
}
