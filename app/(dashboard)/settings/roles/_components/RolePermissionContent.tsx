"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useGetPermissions,
  useGetRolePermissions,
} from "@/modules/role/role.queries";
import { useUpdateRolePermissionsMutation } from "@/modules/role/role.mutations";
import { Skeleton } from "@/components/ui/skeleton";
import { Role } from "@/modules/role/role.types";
import { dialogs } from "@/lib/dialogs";

interface RolePermissionContentProps {
  role: Role;
}

export default function RolePermissionContent({
  role,
}: RolePermissionContentProps) {
  const { data: allPermissions, isLoading: isLoadingAll } = useGetPermissions();
  const { data: rolePermissions, isLoading: isLoadingRole } =
    useGetRolePermissions(role.id);
  const updatePermissionsMutation = useUpdateRolePermissionsMutation();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [prevSyncIds, setPrevSyncIds] = useState<string>("");

  const currentSyncIds =
    rolePermissions
      ?.map((p) => p.id)
      .sort()
      .join(",") || "";
  if (currentSyncIds !== prevSyncIds) {
    setPrevSyncIds(currentSyncIds);
    setSelectedIds(rolePermissions?.map((p) => p.id) || []);
  }

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updatePermissionsMutation.mutate(
      {
        roleId: role.id,
        permissionIds: selectedIds,
      },
      {
        onSuccess: () => {
          dialogs.close();
        },
      },
    );
  };

  const isLoading = isLoadingAll || isLoadingRole;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <form id="role-permission-form" onSubmit={handleSubmit} className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allPermissions?.map((permission) => (
          <div
            key={permission.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/20 transition-all group"
          >
            <Checkbox
              id={`perm-${permission.id}`}
              checked={selectedIds.includes(permission.id)}
              onCheckedChange={() => handleToggle(permission.id)}
              className="data-[state=checked]:scale-110 transition-transform cursor-pointer"
            />
            <label
              htmlFor={`perm-${permission.id}`}
              className="text-sm font-semibold leading-none cursor-pointer flex-1 group-hover:text-primary transition-colors"
            >
              {permission.name}
            </label>
          </div>
        ))}
      </div>
    </form>
  );
}
