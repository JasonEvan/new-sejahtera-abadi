"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleSchema, RoleFormValues } from "@/modules/role/role.validation";
import {
  useAddRoleMutation,
  useEditRoleMutation,
} from "@/modules/role/role.mutations";
import { Role, InsertRole } from "@/modules/role/role.types";
import InputField from "@/components/shared/InputField";

export default function RoleForm({
  role,
  onSuccess,
}: {
  role?: Role;
  onSuccess?: () => void;
}) {
  const addRoleMutation = useAddRoleMutation();
  const editRoleMutation = useEditRoleMutation();

  const methods = useForm<RoleFormValues>({
    defaultValues: {
      name: role?.name || "",
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(roleSchema) as any,
  });

  const { handleSubmit } = methods;

  const onSubmit = (data: RoleFormValues) => {
    if (role) {
      editRoleMutation.mutate(
        { id: role.id, data: data as InsertRole },
        { onSuccess },
      );
    } else {
      addRoleMutation.mutate(data as InsertRole, { onSuccess });
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        id="role-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <InputField
          name="name"
          label="Nama Role"
          placeholder="Contoh: Manager"
        />
      </form>
    </FormProvider>
  );
}
