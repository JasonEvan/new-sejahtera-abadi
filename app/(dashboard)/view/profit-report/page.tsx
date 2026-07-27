import { PageTitle } from "@/components/shared/PageTitle";
import ProfitReportContent from "./_components/ProfitReportContent";

export default function ProfitReportPage() {
  return (
    <div>
      <PageTitle
        title="Laporan Penjualan"
        subtitle="Lihat laporan penjualan berdasarkan bulan dan tahun"
      />
      <ProfitReportContent />
    </div>
  );
}
