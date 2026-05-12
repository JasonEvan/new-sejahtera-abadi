import { PageTitle } from "@/components/shared/PageTitle";
import PaymentInformation from "./_components/PaymentInformation";
import PaymentSummary from "./_components/PaymentSummary";

export default function DeleteSalesPaymentPage() {
  return (
    <div>
      <PageTitle
        title="Hapus Pembayaran Penjualan"
        subtitle="Hapus transaksi pembayaran penjualan yang salah input atau dibatalkan"
      />

      <div className="mt-8 space-y-6">
        <PaymentInformation />
        <PaymentSummary />
      </div>
    </div>
  );
}
