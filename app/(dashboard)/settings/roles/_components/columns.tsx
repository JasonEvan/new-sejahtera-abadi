"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Role } from "@/modules/role/role.types";
import { Button } from "@/components/ui/button";
import { Edit2, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { dialogs } from "@/lib/dialogs";
import {
  editRoleKey,
  updateRolePermissionsKey,
} from "@/modules/role/role.keys";
import RoleForm from "./RoleForm";
import RolePermissionContent from "./RolePermissionContent";
import { alertDialogs } from "@/lib/alert-dialogs";
import { useDeleteRoleMutation } from "@/modules/role/role.mutations";

export const useRoleColumns = () => {
  const deleteRoleMutation = useDeleteRoleMutation();

  const handleEditRole = useCallback((role: Role) => {
    dialogs.open({
      title: "Edit Role",
      description: "Perbarui informasi role ini.",
      type: "form",
      formId: "role-form",
      mutationKey: editRoleKey(),
      children: <RoleForm role={role} onSuccess={() => dialogs.close()} />,
    });
  }, []);

  const handleManagePermissions = useCallback((role: Role) => {
    dialogs.open({
      title: `Atur Permission: ${role.name}`,
      description: "Pilih permission yang akan diberikan kepada role ini.",
      type: "form",
      formId: "role-permission-form",
      mutationKey: updateRolePermissionsKey(),
      children: <RolePermissionContent role={role} />,
    });
  }, []);

  const handleDeleteRole = useCallback(
    (role: Role) => {
      alertDialogs.open({
        title: "Hapus Role?",
        description:
          "Tindakan ini tidak dapat dibatalkan. Role akan dihapus secara permanen.",
        confirmText: "Hapus",
        onConfirm: () => deleteRoleMutation.mutate(role.id),
      });
    },
    [deleteRoleMutation],
  );

  const columns: ColumnDef<Role>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nama Role",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "permissionsCount",
        header: "Permissions",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {row.getValue("permissionsCount") || 0} Permissions
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          const role = row.original;
          return (
            <div className="text-right space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary"
                onClick={() => handleManagePermissions(role)}
              >
                <ShieldCheck className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditRole(role)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => handleDeleteRole(role)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleDeleteRole, handleEditRole, handleManagePermissions],
  );

  return { columns };
};
