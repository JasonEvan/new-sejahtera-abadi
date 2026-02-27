import { Controller, useFormContext } from "react-hook-form";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";
import { Field, FieldError, FieldLabel } from "../ui/field";

type ComboboxFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  items: {
    id: number;
    name: string;
  }[];
};

export default function ComboboxField({
  name,
  label,
  placeholder,
  disabled,
  items,
}: ComboboxFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selectedItem = items.find((item) => item.id === field.value);

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{label}</FieldLabel>
            <Combobox
              items={items}
              value={selectedItem ? selectedItem.name : ""}
              onValueChange={(value) => {
                const selected = items.find((item) => item.name === value);
                if (selected) {
                  field.onChange(selected.id);
                }
              }}
            >
              <ComboboxInput
                placeholder={placeholder}
                aria-invalid={fieldState.invalid ? "true" : "false"}
                onBlur={field.onBlur}
                disabled={disabled}
                ref={(e) => {
                  field.ref(e);
                }}
              />
              <ComboboxContent>
                <ComboboxEmpty>No Items Found</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.id} value={item.name}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </Field>
        );
      }}
    />
  );
}
