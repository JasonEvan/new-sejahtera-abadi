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

type StockItem = { id: number; name: string; ending_stock: number };

type StockComboboxFieldProps = {
  name: string;
  label: string;
  items: StockItem[];
  stockAdjustments?: ReadonlyMap<number, number>;
  isInDialog?: boolean;
};

export default function StockComboboxField({
  name,
  label,
  items,
  stockAdjustments,
  isInDialog,
}: StockComboboxFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Combobox
            autoHighlight
            items={items}
            value={items.find((item) => item.id === field.value) ?? null}
            itemToStringLabel={(item: StockItem) => item.name}
            isItemEqualToValue={(item: StockItem, value: StockItem) =>
              item.id === value.id
            }
            onValueChange={(item: StockItem | null) =>
              field.onChange(item?.id ?? null)
            }
          >
            <ComboboxInput
              aria-invalid={fieldState.invalid ? "true" : "false"}
              onBlur={field.onBlur}
              ref={field.ref}
            />
            <ComboboxContent
              className={isInDialog ? "z-9999" : undefined}
              collisionAvoidance={{ side: "none" }}
            >
              <div
                aria-hidden="true"
                className="grid grid-cols-[minmax(0,1fr)_6rem] border-b text-sm font-medium"
              >
                <span className="px-3 py-2">Nama Barang</span>
                <span className="border-l px-3 py-2 text-right">Stok</span>
              </div>
              <ComboboxEmpty>No Items Found</ComboboxEmpty>
              <ComboboxList className="p-0">
                {(item: StockItem) => (
                  <ComboboxItem
                    key={item.id}
                    value={item}
                    className="grid grid-cols-[minmax(0,1fr)_6rem] gap-0 rounded-none p-0"
                  >
                    <span className="min-w-0 wrap-break-word px-3 py-2">
                      {item.name}
                    </span>
                    <span className="self-stretch border-l py-2 pr-8 pl-2 text-right tabular-nums">
                      {item.ending_stock + (stockAdjustments?.get(item.id) ?? 0)}
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </Field>
      )}
    />
  );
}
