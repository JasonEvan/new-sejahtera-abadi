"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { columns } from "./columns";
import { useGetClients } from "@/modules/client/client.queries";
import { useEffect } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function ClientTable() {
  const { data: clients, isLoading, isError, error } = useGetClients();

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat data client", {
        position: "bottom-right",
      });
    }
  }, [error, isError]);

  return (
    <div className="flex flex-col">
      <Button className="ml-auto mb-2">
        <Plus /> Tambah
      </Button>
      {isLoading && !isError ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable columns={columns} data={clients || []} />
      )}
    </div>
  );
}
