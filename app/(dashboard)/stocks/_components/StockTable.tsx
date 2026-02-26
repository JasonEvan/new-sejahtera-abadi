"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useColumns } from "./columns";
import { useGetStocks } from "@/modules/stock/stock.queries";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { toast } from "sonner";
import { dialogs } from "@/lib/dialogs";
import StockForm from "./StockForm";
import { addStockKey } from "@/modules/stock/stock.keys";

export default function StockTable() {
  const { data: stocks, isLoading, isError, error } = useGetStocks();
  const columns = useColumns();

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat data stock", {
        position: "bottom-right",
      });
    }
  }, [isError, error]);

  function handleAddStock() {
    dialogs.open({
      title: "Tambah Stock",
      description: "Masukkan informasi stock baru",
      type: "form",
      formId: "add-stock-form",
      mutationKey: addStockKey(),
      children: <StockForm />,
    });
  }

  return (
    <div className="flex flex-col">
      <Button className="ml-auto mb-2 cursor-pointer" onClick={handleAddStock}>
        <Plus /> Tambah
      </Button>
      {isLoading && !isError ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={stocks || []}
          maxHeight="500px"
          withFiltering
          searchKey="name"
        />
      )}
    </div>
  );
}
