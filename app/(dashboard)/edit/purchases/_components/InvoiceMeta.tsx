"use client";

import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useUpdatePurchaseMutation } from "@/modules/purchase/purchase.mutations";
import { invoiceMetaValidation } from "@/modules/purchase/purchase.validation";
import { useEditPurchaseStore } from "@/stores/transactions/useEditPurchaseStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";

type InvoiceMetaFormField = z.infer<typeof invoiceMetaValidation>;

export default function InvoiceMeta() {
  const updatePurchaseMutation = useUpdatePurchaseMutation();
  const items = useEditPurchaseStore((state) => state.items);
  const meta = useEditPurchaseStore((state) => state.meta);
  const invoiceInformation = useEditPurchaseStore(
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

    useEditPurchaseStore.getState().setMeta({
      invoice_value: invoiceValue,
      discount,
      total,
    });
  }, [items, watchedDiscount, setValue]);

  const onSubmit = (data: InvoiceMetaFormField) => {
    updatePurchaseMutation.mutate({
      purchaseOrderId: invoiceInformation.purchase_order_id,
      data: {
        client_id: invoiceInformation.client,
        cart: items.map((item) => ({
          stock_id: item.stock_id,
          name: item.name,
          quantity: item.quantity,
          product_price: item.product_price,
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
            <Button type="submit" disabled={updatePurchaseMutation.isPending}>
              {updatePurchaseMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
