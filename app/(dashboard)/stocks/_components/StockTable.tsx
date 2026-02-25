"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { columns } from "./columns";
import { useGetStocks } from "@/modules/stock/stock.queries";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { toast } from "sonner";

export default function StockTable() {
  const { data: stocks, isLoading, isError, error } = useGetStocks();

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat data stock", {
        position: "bottom-right",
      });
    }
  }, [isError, error]);

  return (
    <div className="flex flex-col">
      <Button className="ml-auto mb-2 cursor-pointer">
        <Plus /> Tambah
      </Button>
      {isLoading && !isError ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable columns={columns} data={stocks || []} />
      )}
    </div>
  );
}
