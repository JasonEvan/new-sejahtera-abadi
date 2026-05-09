import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import { useGetStockNames } from "@/modules/stock/stock.queries";
import { useEditSaleStore } from "@/stores/transactions/useEditSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { createEditSaleItemValidation } from "./item.validation";

type AddItemFormField = z.infer<
  ReturnType<typeof createEditSaleItemValidation>
>;

export default function AddItemForm() {
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
      }),
    [stocks, items, baseQuantitiesByStock],
  );

  const methods = useForm<AddItemFormField>({
    defaultValues: {
      stock_id: 0,
      selling_price: undefined,
      quantity: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const { control, setValue, handleSubmit, reset } = methods;

  const watchedStockId = useWatch({
    control,
    name: "stock_id",
  });

  useEffect(() => {
    if (watchedStockId) {
      const selected = stocks?.find((stock) => stock.id === watchedStockId);
      if (selected) {
        setValue("selling_price", selected.selling_price || 0, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedStockId, stocks, setValue]);

  const onSubmit = (data: AddItemFormField) => {
    const selectedStock = stocks?.find((stock) => stock.id === data.stock_id);

    useEditSaleStore.getState().addItem({
      sales_order_line_id: undefined,
      stock_id: data.stock_id,
      name: selectedStock?.name.split(" || ")[0].trim() || "",
      quantity: data.quantity,
      selling_price: data.selling_price,
      subtotal: data.quantity * data.selling_price,
    });

    reset({
      stock_id: 0,
      selling_price: undefined,
      quantity: undefined,
    });

    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        id="add-edit-sale-item-form"
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
          <InputField name="selling_price" label="Harga" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
