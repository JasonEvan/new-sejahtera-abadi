"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/modules/user/user.types";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useDeleteUserMutation } from "@/modules/user/user.mutations";
import { alertDialogs } from "@/lib/alert-dialogs";
import { dialogs } from "@/lib/dialogs";
import UserForm from "./UserForm";
import { editUserKey } from "@/modules/user/user.keys";

export const useColumns = (): ColumnDef<User>[] => {
  const { mutate: deleteUser } = useDeleteUserMutation();

  function handleEdit(user: User) {
    dialogs.open({
      title: "Edit User",
      description: "Perbarui informasi user",
      type: "form",
      formId: "edit-user-form",
      mutationKey: editUserKey(),
      children: <UserForm user={user} />,
    });
  }

  function handleDelete(user: User) {
    alertDialogs.open({
      title: "Hapus User",
      description: `Apakah Anda yakin ingin menghapus user ${user.email}?`,
      onConfirm: () => deleteUser(user.id),
    });
  }

  return [
    {
      accessorKey: "number",
      header: "No.",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.role}</span>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
};
