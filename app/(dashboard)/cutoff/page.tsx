"use client";

import { useState } from "react";
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  usePerformCutoffMutation,
  useCutoffSummaryMutation,
} from "@/modules/system/system.mutations";
import { alertDialogs } from "@/lib/alert-dialogs";
import {
  AlertCircle,
  CalendarDays,
  DatabaseZap,
  Loader2,
  Search,
} from "lucide-react";

export default function CutOffPage() {
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState<{
    unpaidSales: {
      count: number;
      totalBalanceDue: number;
      items: { invoice_number: string; balance_due: number }[];
    };
    unpaidPurchases: {
      count: number;
      totalBalanceDue: number;
      items: { invoice_number: string; balance_due: number }[];
    };
  } | null>(null);

  const { mutate: performCutoff, isPending } = usePerformCutoffMutation();
  const { mutate: getSummary, isPending: isSummaryPending } =
    useCutoffSummaryMutation();

  const handleCutOff = () => {
    if (!endDate) {
      toast.error("Silakan pilih tanggal cut-off yang valid.");
      return;
    }

    performCutoff({ endDate });
  };

  const handleCheckSummary = () => {
    if (!endDate) {
      toast.error("Silakan pilih tanggal cut-off yang valid.");
      return;
    }
    getSummary(endDate, {
      onSuccess: (data) => {
        setSummary(data);
      },
      onError: () => {
        toast.error("Gagal mengambil ringkasan transaksi belum lunas.");
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageTitle
        title="Tutup Buku"
        subtitle="Proses ini akan menghitung saldo awal baru untuk periode berikutnya dan menghapus transaksi yang sudah lunas sampai tanggal terpilih."
      />

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b bg-muted/30">
          <div className="flex items-center gap-3 text-primary">
            <DatabaseZap className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Tutup Buku Tahunan</h2>
          </div>
          <p className="text-muted-foreground mt-2">
            Proses ini akan menghitung saldo awal baru untuk periode berikutnya
            dan menghapus transaksi yang sudah lunas sampai tanggal terpilih.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 flex gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-300">
                Peringatan Penting
              </h4>
              <ul className="text-sm text-amber-700 dark:text-amber-400 list-disc list-inside space-y-1">
                <li>Tindakan ini tidak dapat dibatalkan.</li>
                <li>
                  Semua stok awal akan diperbarui ke posisi akhir periode.
                </li>
                <li>
                  Transaksi (Penjualan/Pembelian) yang sudah lunas akan dihapus.
                </li>
                <li>
                  Pastikan Anda sudah melakukan backup data sebelum melanjutkan.
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="end-date">Tanggal Cut-Off</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  className="pl-10"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-muted/10 border-t flex justify-end gap-3">
          <Button
            variant="outline"
            size="lg"
            disabled={!endDate || isSummaryPending}
            onClick={handleCheckSummary}
          >
            {isSummaryPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memeriksa...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Cek Transaksi Belum Lunas
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            disabled={!endDate || isPending}
            className="font-semibold shadow-lg shadow-destructive/20"
            onClick={() =>
              alertDialogs.open({
                title: "Apakah Anda benar-benar yakin?",
                description: `Proses ini akan memodifikasi data stok dan menghapus transaksi lunas sampai tanggal ${endDate}. Data yang dihapus tidak dapat dikembalikan tanpa backup.`,
                confirmText: "Submit",
                onConfirm: handleCutOff,
              })
            }
          >
            {isPending ? "Memproses..." : "Jalankan Proses Cut-Off"}
          </Button>
        </div>
      </div>

      {summary && (
        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h3>Ringkasan Transaksi Belum Lunas</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales Summary Card */}
            <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                  <Search className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  Penjualan
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Jumlah Transaksi
                </p>
                <p className="text-2xl font-bold">
                  {summary.unpaidSales.count}
                </p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Total Piutang</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(summary.unpaidSales.totalBalanceDue)}
                </p>
              </div>

              {summary.unpaidSales.items.length > 0 && (
                <div className="pt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Daftar Piutang
                  </p>
                  <div className="max-h-40 overflow-y-auto border rounded-lg bg-muted/20">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 border-b">
                            No. Invoice
                          </th>
                          <th className="text-right p-2 border-b">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.unpaidSales.items.map((item) => (
                          <tr key={item.invoice_number}>
                            <td className="p-2 border-b">
                              {item.invoice_number}
                            </td>
                            <td className="p-2 border-b text-right font-medium">
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0,
                              }).format(item.balance_due)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Summary Card */}
            <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                  <Search className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  Pembelian
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Jumlah Transaksi
                </p>
                <p className="text-2xl font-bold">
                  {summary.unpaidPurchases.count}
                </p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Total Hutang</p>
                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(summary.unpaidPurchases.totalBalanceDue)}
                </p>
              </div>

              {summary.unpaidPurchases.items.length > 0 && (
                <div className="pt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Daftar Hutang
                  </p>
                  <div className="max-h-40 overflow-y-auto border rounded-lg bg-muted/20">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 border-b">
                            No. Invoice
                          </th>
                          <th className="text-right p-2 border-b">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.unpaidPurchases.items.map((item) => (
                          <tr key={item.invoice_number}>
                            <td className="p-2 border-b">
                              {item.invoice_number}
                            </td>
                            <td className="p-2 border-b text-right font-medium">
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0,
                              }).format(item.balance_due)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg border border-dashed text-sm text-muted-foreground">
            <p>
              <strong>Catatan:</strong> Transaksi di atas{" "}
              <strong>tidak akan</strong> dihapus selama proses cut-off karena
              masih memiliki saldo (belum lunas).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
