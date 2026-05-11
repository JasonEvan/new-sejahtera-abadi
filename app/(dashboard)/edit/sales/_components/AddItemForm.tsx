import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { alertDialogs } from "@/lib/alert-dialogs";
import { Button } from "@/components/ui/button";
import { useGetStockNames } from "@/modules/stock/stock.queries";
import { useEditSaleStore } from "@/stores/transactions/useEditSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { OctagonAlert } from "lucide-react";
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
      capital_cost: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
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
        setValue("capital_cost", selected.capital_cost, {
          shouldValidate: true,
        });
        setValue("selling_price", selected.selling_price || 0, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedStockId, stocks, setValue]);

  const onSubmit = async (data: AddItemFormField) => {
    if (data.selling_price < data.capital_cost) {
      const isConfirmed = await new Promise<boolean>((resolve) => {
        alertDialogs.open({
          title: "Harga jual lebih rendah dari modal",
          description:
            "Apakah Anda yakin ingin melanjutkan? Pastikan untuk memeriksa kembali harga jual dan modal Anda.",
          icon: OctagonAlert,
          confirmText: "Lanjutkan",
          onConfirm: () => {
            alertDialogs.close();
            resolve(true);
          },
          onCancel: () => {
            resolve(false);
          },
        });
      });

      if (!isConfirmed) {
        return;
      }
    }

    const selectedStock = stocks?.find((stock) => stock.id === data.stock_id);

    useEditSaleStore.getState().addItem({
      sales_order_line_id: undefined,
      stock_id: data.stock_id,
      name: selectedStock?.name.split(" || ")[0].trim() || "",
      quantity: data.quantity,
      capital_cost: data.capital_cost,
      selling_price: data.selling_price,
      subtotal: data.quantity * data.selling_price,
    });

    setFocus("stock_id");
    reset();
  };

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
    </div>
  );
}
