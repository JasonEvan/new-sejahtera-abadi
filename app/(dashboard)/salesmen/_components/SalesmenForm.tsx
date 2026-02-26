import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAddSalespersonMutation } from "@/modules/salesperson/salesperson.mutations";
import { InsertSalesperson } from "@/modules/salesperson/salesperson.types";
import { addSalespersonValidation } from "@/modules/salesperson/salesperson.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export default function SalesmenForm() {
  const addSalespersonMutation = useAddSalespersonMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InsertSalesperson>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(addSalespersonValidation),
  });

  const onSubmit = (data: InsertSalesperson) => {
    addSalespersonMutation.mutate(data);
  };

  return (
    <form
      id="add-salesman-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-x-2">
        <Field>
          <FieldLabel>Nama Sales</FieldLabel>
          <Input {...register("name")} placeholder="John Doe" />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel>Nomor Depan</FieldLabel>
          <Input
            type="number"
            {...register("front_number", { valueAsNumber: true })}
          />
          {errors.front_number && (
            <FieldError>{errors.front_number.message}</FieldError>
          )}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        <Field>
          <FieldLabel>Nomor Telepon</FieldLabel>
          <Input {...register("phone_number")} placeholder="089..." />
          {errors.phone_number && (
            <FieldError>{errors.phone_number.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel>Kode Sales</FieldLabel>
          <Input {...register("sales_code")} />
          {errors.sales_code && (
            <FieldError>{errors.sales_code.message}</FieldError>
          )}
        </Field>
      </div>
    </form>
  );
}
