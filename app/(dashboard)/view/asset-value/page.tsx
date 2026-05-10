import { PageTitle } from "@/components/shared/PageTitle";
import AssetValueContent from "./_components/AssetValueContent";

export const metadata = {
  title: "Nilai Aset",
  description: "Laporan total nilai aset berdasarkan stok dan harga modal.",
};

export default function AssetValuePage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Nilai Aset"
        subtitle="Lihat rincian total nilai aset per item barang"
      />
      <AssetValueContent />
    </div>
  );
}
