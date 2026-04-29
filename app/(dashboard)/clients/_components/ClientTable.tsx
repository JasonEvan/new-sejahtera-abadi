"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useColumns } from "./columns";
import { useGetClients } from "@/modules/client/client.queries";
import { useEffect } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { dialogs } from "@/lib/dialogs";
import ClientForm from "./ClientForm";
import { addClientKey } from "@/modules/client/client.keys";
import { useMe } from "@/modules/user/user.queries";

export default function ClientTable() {
  const { data: clients, isLoading, isError, error } = useGetClients();
  const columns = useColumns();
  const { data: user } = useMe();

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat data client", {
        position: "bottom-right",
      });
    }
  }, [error, isError]);

  function handleAddClient() {
    dialogs.open({
      title: "Tambah Client",
      description: "Masukkan informasi client baru",
      type: "form",
      formId: "add-client-form",
      mutationKey: addClientKey(),
      children: <ClientForm />,
    });
  }

  const canCreate = user?.permissions?.includes("client.create");

  return (
    <div className="flex flex-col">
      {canCreate && (
        <Button
          className="ml-auto mb-2 cursor-pointer"
          onClick={handleAddClient}
        >
          <Plus /> Tambah
        </Button>
      )}
      {isLoading && !isError ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={clients || []}
          maxHeight="500px"
          withFiltering
          searchKey="name"
        />
      )}
    </div>
  );
}
