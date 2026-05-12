import { PageTitle } from "@/components/shared/PageTitle";
import ReturnInformation from "./_components/ReturnInformation";
import ReturnSummary from "./_components/ReturnSummary";

export const metadata = {
  title: "Hapus Retur Penjualan | New Sejahtera Abadi",
  description: "Hapus transaksi retur penjualan",
};

export default function DeleteSalesReturnPage() {
  return (
    <div>
      <PageTitle
        title="Hapus Retur Penjualan"
        subtitle="Cari dan hapus transaksi retur penjualan yang salah input."
      />

      <div className="grid grid-cols-1 gap-6">
        <ReturnInformation />
        <ReturnSummary />
      </div>
    </div>
  );
}
