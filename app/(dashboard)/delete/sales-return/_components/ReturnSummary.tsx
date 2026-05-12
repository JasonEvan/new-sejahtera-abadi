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
import { useGetEditSaleReturnDetail } from "@/modules/sales-return/sales-return.queries";
import { useDeleteSaleReturnMutation } from "@/modules/sales-return/sales-return.mutations";
import { useDeleteSalesReturnStore } from "@/stores/returns/useDeleteSalesReturnStore";
import dayjs from "dayjs";

export default function ReturnSummary() {
  const { transaction_information } = useDeleteSalesReturnStore();
  const deleteReturnMutation = useDeleteSaleReturnMutation();

  const { data: detail, isLoading } = useGetEditSaleReturnDetail(
    transaction_information.sales_return_id,
    !!transaction_information.sales_return_id,
  );

  if (!transaction_information.sales_return_id) return null;

  if (isLoading) {
    return (
      <Card className="mt-6 border-none shadow-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-white/10 rounded mb-2" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/10 rounded" />
        </CardHeader>
        <CardContent className="h-32" />
      </Card>
    );
  }

  const returnDate = detail?.transaction_information.return_date;
  const invoiceNumber = detail?.transaction_information.invoice_number;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
  };

  const returnValue =
    detail?.lines.reduce(
      (acc, line) => acc + line.price * line.return_qty,
      0,
    ) || 0;

  const handleDelete = async () => {
    deleteReturnMutation.mutate(transaction_information.sales_return_id);
  };

  return (
    <Card className="mt-6 border-none shadow-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-destructive">
          Ringkasan Penghapusan
        </CardTitle>
        <CardDescription>
          Informasi detail retur yang akan dihapus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">Nomor Nota</span>
              <span className="font-semibold">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">
                Tanggal Retur
              </span>
              <span className="font-semibold">
                {returnDate ? dayjs(returnDate).format("DD MMMM YYYY") : "-"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-muted-foreground">Total Retur</span>
              <span className="font-bold text-destructive">
                Rp {formatCurrency(returnValue)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-destructive/10 p-4 rounded-lg">
          <p className="text-sm text-destructive font-medium">
            Peringatan: Penghapusan retur akan mengembalikan jumlah barang ke
            dalam nota dan menambah saldo piutang klien. Tindakan ini tidak
            dapat dibatalkan.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          variant="destructive"
          disabled={deleteReturnMutation.isPending}
          className="cursor-pointer px-10 py-6 text-base font-semibold shadow-lg shadow-destructive/20 transition-all hover:scale-105 active:scale-95"
          onClick={() =>
            alertDialogs.open({
              title: "Konfirmasi Penghapusan",
              description: `Apakah Anda yakin ingin menghapus retur untuk nota ${invoiceNumber} tanggal ${dayjs(returnDate).format("DD MMMM YYYY")}? Saldo piutang klien akan bertambah.`,
              confirmText: "Hapus",
              onConfirm: handleDelete,
            })
          }
        >
          {deleteReturnMutation.isPending
            ? "Menghapus..."
            : "Hapus Retur Permanen"}
        </Button>
      </CardFooter>
    </Card>
  );
}
