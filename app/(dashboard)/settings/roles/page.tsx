"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import RoleForm from "./_components/RoleForm";
import { dialogs } from "@/lib/dialogs";
import { addRoleKey } from "@/modules/role/role.keys";
import { useGetRoles } from "@/modules/role/role.queries";
import { DataTable } from "@/components/shared/DataTable";
import { useRoleColumns } from "./_components/columns";

export default function RolesPage() {
  const { data: roles, isLoading } = useGetRoles();
  const { columns } = useRoleColumns();

  const handleAddRole = () => {
    dialogs.open({
      title: "Tambah Role Baru",
      description: "Masukkan informasi role baru yang ingin ditambahkan.",
      type: "form",
      formId: "role-form",
      mutationKey: addRoleKey(),
      children: <RoleForm onSuccess={() => dialogs.close()} />,
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Role</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddRole}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Role
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <DataTable columns={columns} data={roles || []} />
      )}
    </div>
  );
}
