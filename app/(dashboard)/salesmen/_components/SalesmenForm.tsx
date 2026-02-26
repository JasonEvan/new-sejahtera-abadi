import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  useAddSalespersonMutation,
  useEditSalespersonMutation,
} from "@/modules/salesperson/salesperson.mutations";
import {
  EditSalesperson,
  InsertSalesperson,
  Salesperson,
} from "@/modules/salesperson/salesperson.types";
import {
  addSalespersonValidation,
  editSalespersonValidation,
} from "@/modules/salesperson/salesperson.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

type BaseSalespersonForm = Omit<InsertSalesperson, "front_number">;

type SalespersonFormField = BaseSalespersonForm & {
  front_number?: number;
  invoice_number?: number;
};

export default function SalesmenForm({ salesman }: { salesman?: Salesperson }) {
  const isEdit = !!salesman;

  const addSalespersonMutation = useAddSalespersonMutation();
  const editSalespersonMutation = useEditSalespersonMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SalespersonFormField>({
    defaultValues: {
      name: salesman?.name || "",
      front_number: salesman?.front_number ?? undefined,
      invoice_number: salesman?.invoice_number ?? undefined,
      phone_number: salesman?.phone_number ?? undefined,
      sales_code: salesman?.sales_code || "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(
      isEdit ? editSalespersonValidation : addSalespersonValidation,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
  });

  const onSubmit = (data: SalespersonFormField) => {
    if (isEdit) {
      editSalespersonMutation.mutate({
        id: salesman.id,
        data: data as EditSalesperson,
      });
    } else {
      addSalespersonMutation.mutate(data as InsertSalesperson);
    }
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
        {isEdit ? (
          <Field>
            <FieldLabel>Nomor Nota</FieldLabel>
            <Input
              type="number"
              {...register("invoice_number", { valueAsNumber: true })}
            />
            {errors.invoice_number && (
              <FieldError>{errors.invoice_number.message}</FieldError>
            )}
          </Field>
        ) : (
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
        )}
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
