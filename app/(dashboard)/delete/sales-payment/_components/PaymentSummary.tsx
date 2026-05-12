"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { alertDialogs } from "@/lib/alert-dialogs";
import { useDeleteSalesPaymentTransactionMutation } from "@/modules/sales-payment/sales-payment.mutations";
import { useDeleteSalesPaymentStore } from "@/stores/payments/useDeleteSalesPaymentStore";
import dayjs from "dayjs";

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
};

export default function PaymentSummary() {
  const { transaction_information, meta } = useDeleteSalesPaymentStore();
  const deletePaymentMutation = useDeleteSalesPaymentTransactionMutation();

  if (!transaction_information.transaction_id) return null;

  const handleDelete = async () => {
    deletePaymentMutation.mutate(transaction_information.transaction_id);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Ringkasan Pembayaran</CardTitle>
        <CardDescription>
          Informasi detail transaksi pembayaran yang akan dihapus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">
                Nomor Transaksi
              </span>
              <span className="font-semibold">{meta.transaction_number}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">
                Tanggal Pembayaran
              </span>
              <span className="font-semibold">
                {dayjs(meta.payment_date).format("DD MMMM YYYY")}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">
                Jumlah Nota Terbayar
              </span>
              <span className="font-semibold">{meta.invoice_count} Nota</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
          <span className="text-base font-bold">Total Pembayaran</span>
          <span className="text-2xl font-extrabold text-primary">
            {formatRupiah(meta.total_paid)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          variant="destructive"
          disabled={deletePaymentMutation.isPending}
          className="cursor-pointer px-10 py-6 text-base font-semibold shadow-lg shadow-destructive/10 transition-all hover:scale-105 active:scale-95"
          onClick={() =>
            alertDialogs.open({
              title: "Konfirmasi Penghapusan",
              description: `Apakah Anda yakin ingin menghapus transaksi pembayaran ${meta.transaction_number}? Tindakan ini akan mengembalikan saldo piutang klien dan sisa tagihan pada nota terkait. Tindakan ini tidak dapat dibatalkan.`,
              confirmText: "Hapus",
              onConfirm: handleDelete,
            })
          }
        >
          {deletePaymentMutation.isPending
            ? "Menghapus..."
            : "Hapus Pembayaran Permanen"}
        </Button>
      </CardFooter>
    </Card>
  );
}
