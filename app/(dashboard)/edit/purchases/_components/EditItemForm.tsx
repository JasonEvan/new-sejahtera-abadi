import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import { useGetStocks } from "@/modules/stock/stock.queries";
import {
  EditPurchaseItemRow,
  useEditPurchaseStore,
} from "@/stores/transactions/useEditPurchaseStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { editPurchaseItemSchema } from "./item.validation";

type EditItemFormField = z.infer<typeof editPurchaseItemSchema>;

export default function EditItemForm({ data }: { data: EditPurchaseItemRow }) {
  const { data: stocks } = useGetStocks();
  const methods = useForm<EditItemFormField>({
    defaultValues: {
      stock_id: data.stock_id,
      product_price: data.product_price,
      quantity: data.quantity,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(editPurchaseItemSchema),
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
        setValue("product_price", selected.product_price || 0, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedStockId, stocks, setValue]);

  const onSubmit = (value: EditItemFormField) => {
    const selectedStock = stocks?.find((stock) => stock.id === value.stock_id);

    useEditPurchaseStore.getState().updateItem(data.id, {
      purchase_order_line_id: data.purchase_order_line_id,
      stock_id: value.stock_id,
      name: selectedStock?.name || "",
      quantity: value.quantity,
      product_price: value.product_price,
      subtotal: value.quantity * value.product_price,
    });

    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        id="edit-purchase-item-form"
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
          <InputField name="product_price" label="Harga Beli" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
