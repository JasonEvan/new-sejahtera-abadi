import { PageTitle } from "@/components/shared/PageTitle";
import ReturnInformation from "./_components/ReturnInformation";
import ReturnSummary from "./_components/ReturnSummary";

export const metadata = {
  title: "Hapus Retur Pembelian | New Sejahtera Abadi",
  description: "Hapus transaksi retur pembelian",
};

export default function DeletePurchaseReturnPage() {
  return (
    <div>
      <PageTitle
        title="Hapus Retur Pembelian"
        subtitle="Cari dan hapus transaksi retur pembelian yang salah input."
      />

      <div className="grid grid-cols-1 gap-6">
        <ReturnInformation />
        <ReturnSummary />
      </div>
    </div>
  );
}
