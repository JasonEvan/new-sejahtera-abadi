import ComboboxField from "@/components/shared/ComboboxField";
import { DataTable } from "@/components/shared/DataTable";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { ItemValidation } from "@/modules/sale/sale.types";
import { createItemValidation } from "@/modules/sale/sale.validation";
import { useGetStockNames } from "@/modules/stock/stock.queries";
import { useSaleStore } from "@/stores/transactions/useSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useColumns } from "./columns";

export default function Cart() {
  const { data: stocks } = useGetStockNames();
  const cart = useSaleStore((state) => state.cart);
  const columns = useColumns();

  const schema = useMemo(
    () => createItemValidation(stocks || [], cart),
    [stocks, cart],
  );

  const methods = useForm<ItemValidation>({
    defaultValues: {
      stock_id: 0,
      quantity: undefined,
      capital_cost: undefined,
      selling_price: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const { setFocus, reset, handleSubmit, setValue, control } = methods;

  const onSubmit = (data: ItemValidation) => {
    const name = stocks
      ?.find((s) => s.id === data.stock_id)
      ?.name.split(" || ")[0]
      .trim();

    useSaleStore.getState().addToCart({
      id: crypto.randomUUID(),
      stock_id: data.stock_id,
      name: name || "",
      quantity: data.quantity,
      capital_cost: data.capital_cost,
      selling_price: data.selling_price,
      subtotal: data.quantity * data.selling_price,
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
        setValue("capital_cost", selected.capital_cost);
        setValue("selling_price", selected.selling_price || 0);
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
            <InputField name="selling_price" label="Harga Jual" type="number" />
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
