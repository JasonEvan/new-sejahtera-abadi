"use client";

import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useUpdateSaleMutation } from "@/modules/sale/sale.mutations";
import { invoiceMetaValidation } from "@/modules/sale/sale.validation";
import { useEditSaleStore } from "@/stores/transactions/useEditSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";

type InvoiceMetaFormField = z.infer<typeof invoiceMetaValidation>;

export default function InvoiceMeta() {
  const updateSaleMutation = useUpdateSaleMutation();
  const items = useEditSaleStore((state) => state.items);
  const meta = useEditSaleStore((state) => state.meta);
  const invoiceInformation = useEditSaleStore(
    (state) => state.invoice_information,
  );

  const methods = useForm<InvoiceMetaFormField>({
    defaultValues: {
      invoice_value: meta.invoice_value,
      discount: meta.discount,
      total: meta.total,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(invoiceMetaValidation),
  });

  const { handleSubmit, control, setValue } = methods;

  const watchedDiscount = useWatch({
    control,
    name: "discount",
  });

  useEffect(() => {
    const invoiceValue = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    const discount = watchedDiscount || 0;
    const total = invoiceValue - (discount * invoiceValue) / 100;

    setValue("invoice_value", invoiceValue, { shouldValidate: true });
    setValue("total", total, { shouldValidate: true });

    useEditSaleStore.getState().setMeta({
      invoice_value: invoiceValue,
      discount,
      total,
    });
  }, [items, watchedDiscount, setValue]);

  const onSubmit = (data: InvoiceMetaFormField) => {
    updateSaleMutation.mutate({
      salesOrderId: invoiceInformation.sales_order_id,
      data: {
        client_id: invoiceInformation.client,
        cart: items.map((item) => ({
          stock_id: item.stock_id,
          name: item.name,
          quantity: item.quantity,
          selling_price: item.selling_price,
          subtotal: item.subtotal,
        })),
        invoice_value: data.invoice_value,
        discount: data.discount,
        total: data.total,
      },
    });
  };

  return (
    <div className="mt-5">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-x-2">
            <InputField
              name="invoice_value"
              label="Nilai Nota"
              type="number"
              disabled
            />
            <InputField
              name="total"
              label="Total Akhir"
              type="number"
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-x-2">
            <InputField name="discount" label="Diskon" type="number" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={updateSaleMutation.isPending}>
              {updateSaleMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
