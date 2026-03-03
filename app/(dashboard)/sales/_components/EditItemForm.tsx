import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import { ItemValidation, SaleTableRow } from "@/modules/sale/sale.types";
import { createItemValidation } from "@/modules/sale/sale.validation";
import { useGetStockNames } from "@/modules/stock/stock.queries";
import { useSaleStore } from "@/stores/transactions/useSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

export default function EditItemForm({ data }: { data: SaleTableRow }) {
  const { data: stocks } = useGetStockNames();
  const cart = useSaleStore((state) => state.cart);

  const schema = useMemo(
    () => createItemValidation(stocks || [], cart, data.id),
    [stocks, cart, data.id],
  );

  const methods = useForm<ItemValidation>({
    defaultValues: {
      stock_id: data.stock_id,
      quantity: data.quantity,
      capital_cost: data.capital_cost,
      selling_price: data.selling_price,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const onSubmit = (value: ItemValidation) => {
    const name = stocks
      ?.find((s) => s.id === value.stock_id)
      ?.name.split(" || ")[0]
      .trim();

    useSaleStore.getState().updateCart(data.id, {
      id: data.id,
      name: name || "",
      stock_id: value.stock_id,
      quantity: value.quantity,
      capital_cost: value.capital_cost,
      selling_price: value.selling_price,
      subtotal: value.quantity * value.selling_price,
    });

    dialogs.close();
  };

  const { control, handleSubmit, setValue } = methods;

  const watchedStockId = useWatch({
    control,
    name: "stock_id",
  });

  const initialStockId = useRef<number>(data.stock_id);
  const hasUserChangedStockId = useRef<boolean>(false);

  useEffect(() => {
    if (watchedStockId && watchedStockId !== initialStockId.current) {
      hasUserChangedStockId.current = true;
    }

    if (watchedStockId && hasUserChangedStockId.current) {
      const selected = stocks?.find((s) => s.id === watchedStockId);

      if (selected) {
        setValue("capital_cost", selected.capital_cost, {
          shouldValidate: true,
        });
        setValue("selling_price", selected.selling_price || 0, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedStockId, setValue, stocks]);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        id="edit-item-form"
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-x-2">
          <ComboboxField
            name="stock_id"
            label="Nama Barang"
            items={stocks || []}
            isInDialog
          />
          <InputField name="quantity" label="Jumlah" type="number" />
        </div>
        <div className="grid grid-cols-2 gap-x-2">
          <InputField
            name="capital_cost"
            label="Modal"
            type="number"
            disabled
          />
          <InputField name="selling_price" label="Harga Jual" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
