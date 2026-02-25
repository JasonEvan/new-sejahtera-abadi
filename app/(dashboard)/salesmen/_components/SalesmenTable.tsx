"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGetSalespersons } from "@/modules/salesperson/salesperson.queries";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { columns } from "./columns";

export default function SalesmenTable() {
  const {
    data: salespersons,
    isLoading,
    isError,
    error,
  } = useGetSalespersons();

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat data salesman", {
        position: "bottom-right",
      });
    }
  }, [error, isError]);

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
        <DataTable columns={columns} data={salespersons || []} />
      )}
    </div>
  );
}
