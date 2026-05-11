import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useGetStocks } from "@/modules/stock/stock.queries";
import { useEditPurchaseStore } from "@/stores/transactions/useEditPurchaseStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { editPurchaseItemSchema } from "./item.validation";

type AddItemFormField = z.infer<typeof editPurchaseItemSchema>;

export default function AddItemForm() {
  const { data: stocks } = useGetStocks();
  const methods = useForm<AddItemFormField>({
    defaultValues: {
      stock_id: 0,
      product_price: undefined,
      quantity: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(editPurchaseItemSchema),
  });

  const { control, setValue, handleSubmit, reset, setFocus } = methods;

  const watchedStockId = useWatch({
    control,
    name: "stock_id",
  });

  useEffect(() => {
    if (watchedStockId) {
      const selected = stocks?.find((stock) => stock.id === watchedStockId);
      if (selected) {
        setValue("product_price", selected.product_price || 0, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedStockId, stocks, setValue]);

  const onSubmit = (data: AddItemFormField) => {
    const selectedStock = stocks?.find((stock) => stock.id === data.stock_id);

    useEditPurchaseStore.getState().addItem({
      purchase_order_line_id: undefined,
      stock_id: data.stock_id,
      name: selectedStock?.name || "",
      quantity: data.quantity,
      product_price: data.product_price,
      subtotal: data.quantity * data.product_price,
    });

    setFocus("stock_id");
    reset();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <ComboboxField
          name="stock_id"
          label="Nama Barang"
          items={stocks || []}
        />
        <div className="grid grid-cols-2 gap-x-2">
          <InputField name="quantity" label="Jumlah" type="number" />
          <InputField name="product_price" label="Harga Beli" type="number" />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Add</Button>
        </div>
      </form>
    </FormProvider>
  );
}
