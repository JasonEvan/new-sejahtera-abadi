import { PageTitle } from "@/components/shared/PageTitle";
import ExportContent from "./_components/ExportContent";

export default function ExportPage() {
  return (
    <div className="space-y-4">
      <PageTitle title="Export" subtitle="Export data ke CSV" />
      <ExportContent />
    </div>
  );
}
