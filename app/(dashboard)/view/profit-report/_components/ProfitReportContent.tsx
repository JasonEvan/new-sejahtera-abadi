"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Search } from "lucide-react";
import { useGetProfitReport } from "@/modules/report/report.queries";
import { printService } from "@/lib/print.service";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { columns } from "./columns";

const MONTHS = [
  { id: 1, name: "Januari" },
  { id: 2, name: "Februari" },
  { id: 3, name: "Maret" },
  { id: 4, name: "April" },
  { id: 5, name: "Mei" },
  { id: 6, name: "Juni" },
  { id: 7, name: "Juli" },
  { id: 8, name: "Agustus" },
  { id: 9, name: "September" },
  { id: 10, name: "Oktober" },
  { id: 11, name: "November" },
  { id: 12, name: "Desember" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2019 }, (_, i) => ({
  id: 2020 + i,
  name: String(2020 + i),
}));

type ProfitReportForm = {
  month: number;
  year: number;
};

export default function ProfitReportContent() {
  const [params, setParams] = useState<ProfitReportForm | null>(null);

  const {
    data: rows,
    isLoading,
    isError,
    error,
  } = useGetProfitReport(params?.month ?? 0, params?.year ?? 0, !!params);

  const methods = useForm<ProfitReportForm>({
    defaultValues: { month: 0, year: 0 },
  });

  const onSubmit = (data: ProfitReportForm) => {
    if (!data.month || !data.year) {
      toast.error("Pilih bulan dan tahun terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }
    setParams({ ...data, month: data.month }); // Backend expects 1-12 for EXTRACT(MONTH FROM ...)
  };

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat laporan laba", {
        position: "bottom-right",
      });
    }
  }, [isError, error]);

  return (
    <div className="flex flex-col gap-y-3 mt-3">
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex items-end gap-x-3"
        >
          <div className="w-48">
            <ComboboxField name="month" label="Bulan" items={MONTHS} />
          </div>
          <div className="w-36">
            <ComboboxField name="year" label="Tahun" items={YEARS} />
          </div>
          <Button type="submit">Cari</Button>
          <Button
            type="button"
            onClick={() => {
              if (params) {
                const monthName =
                  MONTHS.find((m) => m.id === params.month)?.name ?? "";
                printService.handlePrintProfitReport(
                  rows || [],
                  monthName,
                  params.year,
                );
              }
            }}
            disabled={!params || !rows || rows.length === 0 || isLoading}
          >
            Print
          </Button>
        </form>
      </FormProvider>
      {params && (
        <div className="bg-muted/50 p-4 rounded-xl border-l-4 border-primary flex items-center gap-x-3 shadow-sm">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Search className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Menampilkan hasil untuk:{" "}
            <span className="font-bold text-foreground">
              {MONTHS.find((m) => m.id === params.month)?.name} {params.year}
            </span>
          </p>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable data={rows || []} columns={columns} maxHeight="600px" />
      )}
    </div>
  );
}
