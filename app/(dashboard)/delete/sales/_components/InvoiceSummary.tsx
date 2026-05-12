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
import { useDeleteSaleMutation } from "@/modules/sale/sale.mutations";
import { useDeleteSaleStore } from "@/stores/transactions/useDeleteSaleStore";

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
};

export default function InvoiceSummary() {
  const { invoice_information, meta, clear } = useDeleteSaleStore();
  const deleteSaleMutation = useDeleteSaleMutation();

  if (!invoice_information.sales_order_id) return null;

  const handleDelete = async () => {
    deleteSaleMutation.mutate(invoice_information.sales_order_id);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Ringkasan Nota</CardTitle>
        <CardDescription>
          Informasi detail nota yang akan dihapus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">Nomor Nota</span>
              <span className="font-semibold">
                {invoice_information.invoice_number}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">
                Jumlah Produk
              </span>
              <span className="font-semibold">{meta.product_count} Item</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">Nilai Nota</span>
              <span className="font-semibold">
                {formatRupiah(meta.invoice_value)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">Diskon (%)</span>
              <span className="font-semibold text-destructive">
                {meta.discount}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
          <span className="text-base font-bold">Total Akhir</span>
          <span className="text-2xl font-extrabold text-primary">
            {formatRupiah(meta.total)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          variant="destructive"
          disabled={deleteSaleMutation.isPending}
          className="cursor-pointer px-10 py-6 text-base font-semibold shadow-lg shadow-destructive/10 transition-all hover:scale-105 active:scale-95"
          onClick={() =>
            alertDialogs.open({
              title: "Konfirmasi Penghapusan",
              description: `Apakah Anda yakin ingin menghapus nota ${invoice_information.invoice_number}? Tindakan ini akan menghapus semua data transaksi terkait secara permanen dan tidak dapat dibatalkan.`,
              confirmText: "Hapus",
              onConfirm: handleDelete,
            })
          }
        >
          {deleteSaleMutation.isPending
            ? "Menghapus..."
            : "Hapus Nota Permanen"}
        </Button>
      </CardFooter>
    </Card>
  );
}
