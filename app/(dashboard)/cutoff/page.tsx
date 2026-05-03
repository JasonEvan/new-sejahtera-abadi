"use client";

import { useState } from "react";
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CalendarDays, DatabaseZap } from "lucide-react";

export default function CutOffPage() {
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCutOff = async () => {
    if (!endDate) {
      toast.error("Silakan pilih tanggal cut-off yang valid.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/cutoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endDate }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Terjadi kesalahan saat proses cut-off.",
        );
      }

      toast.success("Proses Cut-Off berhasil diselesaikan!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
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

        <div className="p-6 bg-muted/10 border-t flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                disabled={!endDate || isLoading}
                className="font-semibold shadow-lg shadow-destructive/20"
              >
                {isLoading ? "Memproses..." : "Jalankan Proses Cut-Off"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Apakah Anda benar-benar yakin?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Proses ini akan memodifikasi data stok dan menghapus transaksi
                  lunas sampai tanggal {endDate}. Data yang dihapus tidak dapat
                  dikembalikan tanpa backup.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCutOff}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Ya, Jalankan Cut-Off
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
