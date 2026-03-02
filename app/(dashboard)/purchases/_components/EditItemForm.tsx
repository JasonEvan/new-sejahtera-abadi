import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import {
  ItemValidation,
  PurchaseTableRow,
} from "@/modules/purchase/purchase.types";
import { createItemValidation } from "@/modules/purchase/purchase.validation";
import { useGetStocks } from "@/modules/stock/stock.queries";
import { usePurchaseStore } from "@/stores/transactions/usePurchaseStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

export default function EditItemForm({ data }: { data: PurchaseTableRow }) {
  const { data: stocks } = useGetStocks();
  const methods = useForm<ItemValidation>({
    defaultValues: {
      stock_id: data.stock_id,
      quantity: data.quantity,
      selling_price: data.selling_price,
      product_price: data.product_price,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createItemValidation),
  });

  const onSubmit = (value: ItemValidation) => {
    const name = stocks?.find((s) => s.id === value.stock_id)?.name;

    usePurchaseStore.getState().updateCart(data.id, {
      id: data.id,
      name: name || "",
      stock_id: value.stock_id,
      quantity: value.quantity,
      product_price: value.product_price,
      selling_price: value.selling_price,
      subtotal: value.quantity * value.product_price,
    });

    dialogs.close();
  };

  const { handleSubmit, setValue, control } = methods;

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
        setValue("selling_price", selected.selling_price || 0, {
          shouldValidate: true,
        });
        setValue("product_price", selected.product_price, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedStockId, setValue, stocks]);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        id="edit-purchase-item-form"
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-x-2">
          <ComboboxField
            name="stock_id"
            label="Nama Barang"
            items={stocks || []}
          />
          <InputField name="quantity" label="Jumlah" type="number" />
        </div>
        <div className="grid grid-cols-2 gap-x-2">
          <InputField
            name="selling_price"
            label="Harga Jual"
            type="number"
            disabled
          />
          <InputField name="product_price" label="Harga Beli" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
