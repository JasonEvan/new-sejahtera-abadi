"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Search } from "lucide-react";
import { printService } from "@/lib/print.service";
import { useGetInventoryLedgers } from "@/modules/report/report.queries";
import { useGetStocks } from "@/modules/stock/stock.queries";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { columns } from "./columns";

export default function InventoryLedgerContent() {
  const [stockId, setStockId] = useState(0);
  const {
    data: inventoryLedgers,
    isLoading,
    isError: isResultError,
    error: resultError,
  } = useGetInventoryLedgers(stockId, !!stockId);
  const { data: stocks, isError, error } = useGetStocks();

  const methods = useForm<{ stock_id: number }>({
    defaultValues: {
      stock_id: 0,
    },
  });

  const onSubmit = (data: { stock_id: number }) => {
    setStockId(data.stock_id);
  };

  const selectedStockName =
    stocks?.find((stock) => stock.id === stockId)?.name ?? "";

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat data nama barang", {
        position: "bottom-right",
      });
    }
  }, [isError, error]);

  useEffect(() => {
    if (isResultError) {
      toast.error(resultError.message || "Gagal memuat data inventory ledger", {
        position: "bottom-right",
      });
    }
  }, [isResultError, resultError]);

  return (
    <div className="flex flex-col gap-y-3 mt-3">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3">
          <div className="w-1/3">
            <ComboboxField
              name="stock_id"
              label="Nama Barang"
              items={stocks || []}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Submit</Button>
            <Button
              type="button"
              onClick={() =>
                printService.handlePrintInventoryLedger(
                  inventoryLedgers || [],
                  selectedStockName,
                )
              }
              disabled={!inventoryLedgers || inventoryLedgers.length === 0}
            >
              Print
            </Button>
          </div>
        </form>
      </FormProvider>
      {stockId !== 0 && (
        <div className="bg-muted/50 p-4 rounded-xl border-l-4 border-primary flex items-center gap-x-3 shadow-sm">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Search className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Menampilkan hasil untuk:{" "}
            <span className="font-bold text-foreground">{selectedStockName}</span>
          </p>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable
          data={inventoryLedgers || []}
          columns={columns}
          maxHeight="500px"
        />
      )}
    </div>
  );
}
