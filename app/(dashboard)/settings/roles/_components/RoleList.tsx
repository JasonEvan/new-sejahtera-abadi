"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetRoles } from "@/modules/role/role.queries";
import { useDeleteRoleMutation } from "@/modules/role/role.mutations";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ShieldCheck } from "lucide-react";
import { dialogs } from "@/lib/dialogs";
import { alertDialogs } from "@/lib/alert-dialogs";
import RoleForm from "./RoleForm";
import RolePermissionContent from "./RolePermissionContent";

export default function RoleList() {
  const { data: roles, isLoading } = useGetRoles();
  const deleteRoleMutation = useDeleteRoleMutation();

  const handleEditRole = (role: any) => {
    dialogs.open({
      title: "Edit Role",
      description: "Perbarui informasi role ini.",
      type: "form",
      formId: "role-form",
      mutationKey: ["edit-role"],
      children: <RoleForm role={role} onSuccess={() => dialogs.close()} />,
    });
  };

  const handleManagePermissions = (role: any) => {
    dialogs.open({
      title: `Atur Permission: ${role.name}`,
      description: "Pilih permission yang akan diberikan kepada role ini.",
      type: "form",
      formId: "role-permission-form",
      mutationKey: ["update-role-permissions"],
      children: <RolePermissionContent role={role} />,
    });
  };

  const handleDeleteRole = (role: any) => {
    alertDialogs.open({
      title: "Hapus Role?",
      description:
        "Tindakan ini tidak dapat dibatalkan. Role akan dihapus secara permanen.",
      confirmText: "Hapus",
      onConfirm: () => deleteRoleMutation.mutate(role.id),
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Role</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles?.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.name}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {role.permissionsCount || 0} Permissions
                </span>
              </TableCell>
              <TableCell className="text-right space-x-2">
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
              </TableCell>
            </TableRow>
          ))}
          {roles?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center h-24 text-muted-foreground"
              >
                Belum ada role.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
