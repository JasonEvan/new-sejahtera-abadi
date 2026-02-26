"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGetSalespersons } from "@/modules/salesperson/salesperson.queries";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useColumns } from "./columns";
import { dialogs } from "@/lib/dialogs";
import SalesmenForm from "./SalesmenForm";
import { addSalespersonKey } from "@/modules/salesperson/salesperson.keys";

export default function SalesmenTable() {
  const {
    data: salespersons,
    isLoading,
    isError,
    error,
  } = useGetSalespersons();
  const columns = useColumns();

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat data salesman", {
        position: "bottom-right",
      });
    }
  }, [error, isError]);

  function handleAddSalesperson() {
    dialogs.open({
      title: "Tambah Salesman",
      description: "Masukkan informasi salesman baru",
      type: "form",
      formId: "add-salesman-form",
      mutationKey: addSalespersonKey(),
      children: <SalesmenForm />,
    });
  }

  return (
    <div className="flex flex-col">
      <Button
        className="ml-auto mb-2 cursor-pointer"
        onClick={handleAddSalesperson}
      >
        <Plus /> Tambah
      </Button>
      {isLoading && !isError ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={salespersons || []}
          withFiltering
          searchKey="name"
        />
      )}
    </div>
  );
}
