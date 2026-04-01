import { PageTitle } from "@/components/shared/PageTitle";
import BackupContent from "./_components/BackupContent";

export default function BackupPage() {
  return (
    <div className="space-y-4">
      <PageTitle title="Backup" subtitle="Backup, restore, dan reset seluruh data" />
      <BackupContent />
    </div>
  );
}
