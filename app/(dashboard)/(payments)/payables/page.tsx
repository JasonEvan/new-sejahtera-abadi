import { PageTitle } from "@/components/shared/PageTitle";
import PayablesContent from "./_components/PayablesContent";

export default function PayablesPage() {
  return (
    <div>
      <PageTitle
        title="Pelunasan Utang"
        subtitle="Kelola pelunasan utang client"
      />
      <PayablesContent />
    </div>
  );
}
