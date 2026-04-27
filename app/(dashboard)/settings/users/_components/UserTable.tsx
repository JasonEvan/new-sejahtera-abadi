"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useColumns } from "./columns";
import { useGetUsers } from "@/modules/user/user.queries";
import { useEffect } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { dialogs } from "@/lib/dialogs";
import UserForm from "./UserForm";
import { addUserKey } from "@/modules/user/user.keys";

export default function UserTable() {
  const { data: users, isLoading, isError, error } = useGetUsers();
  const columns = useColumns();

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat data user", {
        position: "bottom-right",
      });
    }
  }, [error, isError]);

  function handleAddUser() {
    dialogs.open({
      title: "Tambah User",
      description: "Masukkan informasi user baru",
      type: "form",
      formId: "add-user-form",
      mutationKey: addUserKey(),
      children: <UserForm />,
    });
  }

  return (
    <div className="flex flex-col">
      <Button className="ml-auto mb-2 cursor-pointer" onClick={handleAddUser}>
        <Plus /> Tambah
      </Button>
      {isLoading && !isError ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users || []}
          maxHeight="500px"
          withFiltering
          searchKey="email"
        />
      )}
    </div>
  );
}
