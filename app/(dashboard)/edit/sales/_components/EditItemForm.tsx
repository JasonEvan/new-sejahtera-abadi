import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import { useGetStockNames } from "@/modules/stock/stock.queries";
import {
  EditSaleItemRow,
  useEditSaleStore,
} from "@/stores/transactions/useEditSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { createEditSaleItemValidation } from "./item.validation";

type EditItemFormField = z.infer<
  ReturnType<typeof createEditSaleItemValidation>
>;

export default function EditItemForm({ data }: { data: EditSaleItemRow }) {
  const { data: stocks } = useGetStockNames();
  const items = useEditSaleStore((state) => state.items);
  const baseQuantitiesByStock = useEditSaleStore(
    (state) => state.base_quantities_by_stock,
  );

  const schema = useMemo(
    () =>
      createEditSaleItemValidation({
        stocks: stocks || [],
        items,
        baseQuantitiesByStock,
        editingRowId: data.id,
      }),
    [stocks, items, baseQuantitiesByStock, data.id],
  );

  const methods = useForm<EditItemFormField>({
    defaultValues: {
      stock_id: data.stock_id,
      selling_price: data.selling_price,
      quantity: data.quantity,
      capital_cost: data.capital_cost,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const { control, setValue, handleSubmit } = methods;

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
      const selected = stocks?.find((stock) => stock.id === watchedStockId);
      if (selected) {
        setValue("capital_cost", selected.capital_cost, {
          shouldValidate: true,
        });
        setValue("selling_price", selected.selling_price || 0, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedStockId, stocks, setValue]);

  const onSubmit = (value: EditItemFormField) => {
    const selectedStock = stocks?.find((stock) => stock.id === value.stock_id);

    useEditSaleStore.getState().updateItem(data.id, {
      sales_order_line_id: data.sales_order_line_id,
      stock_id: value.stock_id,
      name: selectedStock?.name.split(" || ")[0].trim() || "",
      quantity: value.quantity,
      capital_cost: value.capital_cost,
      selling_price: value.selling_price,
      subtotal: value.quantity * value.selling_price,
    });

    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        id="edit-sale-item-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3"
      >
        <ComboboxField
          name="stock_id"
          label="Nama Barang"
          items={stocks || []}
          isInDialog
        />
        <div className="grid grid-cols-2 gap-x-2">
          <InputField name="quantity" label="Jumlah" type="number" />
          <InputField name="selling_price" label="Harga Jual" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
