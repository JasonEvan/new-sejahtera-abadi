import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
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

  const { control, setValue, handleSubmit, reset } = methods;

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

    reset({
      stock_id: 0,
      product_price: undefined,
      quantity: undefined,
    });

    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        id="add-edit-purchase-item-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-x-2">
          <ComboboxField
            name="stock_id"
            label="Nama Barang"
            items={stocks || []}
            isInDialog
          />
          <InputField name="product_price" label="Harga" type="number" />
        </div>
        <div className="grid grid-cols-2 gap-x-2">
          <InputField name="quantity" label="Jumlah" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
