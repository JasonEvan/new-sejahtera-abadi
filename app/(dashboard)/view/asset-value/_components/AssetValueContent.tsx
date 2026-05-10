"use client";

import { useGetAssetValues } from "@/modules/report/report.queries";
import { DataTable } from "@/components/shared/DataTable";
import { columns } from "./columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssetValueContent() {
  const { data, isLoading, isError } = useGetAssetValues();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
        <p>Gagal memuat data nilai aset.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <Card className="relative overflow-hidden border-none bg-linear-to-br from-orange-600 via-amber-600 to-amber-700 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-orange-400/20 blur-3xl" />

        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider opacity-80">
            Total Nilai Aset
          </CardTitle>
          <div className="rounded-lg bg-white/20 p-2 backdrop-blur-md">
            <Boxes className="size-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-black tracking-tighter sm:text-5xl">
            {formatCurrency(data?.grandTotalAssetValue ?? 0)}
          </div>
          <p className="mt-2 text-sm font-medium opacity-70">
            Total nilai dari {data?.items.length ?? 0} item barang (Qty × Modal)
          </p>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          withFiltering
          searchKey="itemName"
        />
      </div>
    </div>
  );
}
