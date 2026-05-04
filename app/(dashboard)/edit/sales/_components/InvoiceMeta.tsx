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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID").format(value || 0);
};

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

  const [watchedInvoiceValue, watchedDiscount, watchedTotal] = useWatch({
    control,
    name: ["invoice_value", "discount", "total"],
  });

  useEffect(() => {
    const invoiceValue = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    const discountValue = Number(watchedDiscount) || 0;
    const total = Math.round(
      invoiceValue - (discountValue * invoiceValue) / 100,
    );

    setValue("invoice_value", invoiceValue, { shouldValidate: true });
    setValue("total", total, { shouldValidate: true });

    useEditSaleStore.getState().setMeta({
      invoice_value: invoiceValue,
      discount: discountValue,
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col items-end space-y-1">
            <div className="flex justify-between w-full max-w-[300px] items-center">
              <span className="text-muted-foreground font-medium">
                Nilai Nota
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(watchedInvoiceValue as number)}
              </span>
            </div>

            <div className="flex justify-between w-full max-w-[300px] items-center">
              <span className="text-muted-foreground font-medium">
                Diskon (%)
              </span>
              <div className="w-24">
                <InputField
                  name="discount"
                  label=""
                  type="number"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="w-full max-w-[300px] border-t-2 border-border my-2" />

            <div className="flex justify-between w-full max-w-[300px] items-center py-1">
              <span className="text-xl font-bold text-foreground">
                Total Akhir
              </span>
              <span className="text-2xl font-black text-primary">
                {formatCurrency(watchedTotal as number)}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              size="lg"
              className="px-10"
              disabled={updateSaleMutation.isPending}
            >
              {updateSaleMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
