"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, UserFormValues } from "@/modules/user/user.validation";
import {
  useAddUserMutation,
  useEditUserMutation,
} from "@/modules/user/user.mutations";
import { User, InsertUser } from "@/modules/user/user.types";
import InputField from "@/components/shared/InputField";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useGetRoles } from "@/modules/role/role.queries";

export default function UserForm({ user }: { user?: User }) {
  const addUserMutation = useAddUserMutation();
  const editUserMutation = useEditUserMutation();
  const { data: roles, isLoading: isLoadingRoles } = useGetRoles();

  const methods = useForm<UserFormValues>({
    defaultValues: {
      email: user?.email || "",
      password: "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role_id: (user?.role_id ?? undefined) as any,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userSchema) as any,
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = methods;

  const onSubmit = (data: UserFormValues) => {
    if (user) {
      editUserMutation.mutate({
        id: user.id,
        data: data as InsertUser,
      });
    } else {
      addUserMutation.mutate(data as unknown as InsertUser);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        id={user ? "edit-user-form" : "add-user-form"}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <InputField
          name="email"
          label="Email"
          type="email"
          placeholder="admin@example.com"
        />
        <InputField
          name="password"
          label={
            user ? "Password (Kosongkan jika tidak ingin diubah)" : "Password"
          }
          type="password"
          placeholder="******"
        />

        <Field data-invalid={!!errors.role_id}>
          <FieldLabel>Role</FieldLabel>
          <select
            {...register("role_id")}
            disabled={isLoadingRoles}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Pilih Role</option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
              </option>
            ))}
          </select>
          {errors.role_id && <FieldError>{errors.role_id.message}</FieldError>}
        </Field>
      </form>
    </FormProvider>
  );
}
