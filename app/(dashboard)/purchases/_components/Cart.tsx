import { DataTable } from "@/components/shared/DataTable";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useColumns } from "./columns";
import { usePurchaseStore } from "@/stores/transactions/usePurchaseStore";
import { useGetStocks } from "@/modules/stock/stock.queries";
import { useEffect } from "react";
import { createItemValidation } from "@/modules/purchase/purchase.validation";
import { ItemValidation } from "@/modules/purchase/purchase.types";
import { zodResolver } from "@hookform/resolvers/zod";
import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";

export default function Cart() {
  const { data: stocks } = useGetStocks();
  const columns = useColumns();
  const cart = usePurchaseStore((state) => state.cart);

  const methods = useForm<ItemValidation>({
    defaultValues: {
      stock_id: 0,
      quantity: undefined,
      product_price: undefined,
      capital_cost: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createItemValidation),
  });

  const { reset, setFocus, handleSubmit, setValue, control } = methods;

  const onSubmit = (data: ItemValidation) => {
    usePurchaseStore.getState().addToCart({
      id: crypto.randomUUID(),
      stock_id: data.stock_id,
      name: stocks?.find((s) => s.id === data.stock_id)?.name || "",
      quantity: data.quantity,
      product_price: data.product_price,
      capital_cost: data.capital_cost,
      subtotal: data.quantity * data.product_price,
    });

    setFocus("stock_id");
    reset();
  };

  const watchedStockId = useWatch({
    control,
    name: "stock_id",
  });

  useEffect(() => {
    if (watchedStockId) {
      const selected = stocks?.find((s) => s.id === watchedStockId);

      if (selected) {
        setValue("product_price", selected.product_price || 0, {
          shouldValidate: true,
        });
        setValue("capital_cost", selected.capital_cost || 0, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedStockId, setValue, stocks]);

  return (
    <div className="space-y-5">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
              name="capital_cost"
              label="Modal"
              type="number"
              disabled
            />
            <InputField name="product_price" label="Harga Beli" type="number" />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Add</Button>
          </div>
        </form>
      </FormProvider>
      <DataTable columns={columns} data={cart} maxHeight="500px" />
    </div>
  );
}
