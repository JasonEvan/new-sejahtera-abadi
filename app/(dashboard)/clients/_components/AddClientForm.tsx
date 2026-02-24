import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAddClientMutation } from "@/modules/client/client.mutations";
import { addClientValidation } from "@/modules/client/client.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

type AddClientFormField = z.infer<typeof addClientValidation>;

export default function AddClientForm() {
  const addClientMutation = useAddClientMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddClientFormField>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(addClientValidation),
  });

  const onSubmit = (data: AddClientFormField) => {
    addClientMutation.mutate(data);
  };

  return (
    <form
      id="add-client-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-x-2">
        <Field>
          <FieldLabel>Nama Client</FieldLabel>
          <Input {...register("name")} placeholder="John Doe" />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel>Kota Client</FieldLabel>
          <Input {...register("city")} placeholder="Semarang" />
          {errors.city && <FieldError>{errors.city.message}</FieldError>}
        </Field>
      </div>
      <Field>
        <FieldLabel>Alamat Client</FieldLabel>
        <Input {...register("address")} placeholder="Jl. Mawar No. 123" />
        {errors.address && <FieldError>{errors.address.message}</FieldError>}
      </Field>
      <div className="grid grid-cols-2 gap-x-2">
        <Field>
          <FieldLabel>Nomor Telepon</FieldLabel>
          <Input {...register("phone")} placeholder="089..." />
          {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel>Nomor HP</FieldLabel>
          <Input {...register("mobile_phone")} placeholder="089..." />
          {errors.mobile_phone && (
            <FieldError>{errors.mobile_phone.message}</FieldError>
          )}
        </Field>
      </div>
    </form>
  );
}
