import { PageTitle } from "@/components/shared/PageTitle";
import StockTable from "./_components/StockTable";

export default function StocksPage() {
  return (
    <div>
      <PageTitle title="Stock" subtitle="Kelola produk dan stock" />
      <StockTable />
    </div>
  );
}
