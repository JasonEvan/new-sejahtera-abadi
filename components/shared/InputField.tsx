import { useFormContext, useFormState } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

type InputFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "number" | "date" | "email" | "text" | "password";
  disabled?: boolean;
};

export default function InputField({
  name,
  label,
  placeholder,
  type = "text",
  disabled,
}: InputFieldProps) {
  const { register, control } = useFormContext();
  const { errors } = useFormState({
    control,
    name,
  });

  return (
    <Field data-invalid={!!errors[name]}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type={type}
        placeholder={placeholder}
        {...register(name, {
          valueAsNumber: type === "number",
        })}
        aria-invalid={!!errors[name]}
        disabled={disabled}
      />
      {errors[name] && (
        <FieldError>{errors[name].message as string}</FieldError>
      )}
    </Field>
  );
}
