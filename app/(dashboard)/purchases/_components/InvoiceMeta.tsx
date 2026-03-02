import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useCreatePurchaseMutation } from "@/modules/purchase/purchase.mutations";
import { invoiceMetaValidation } from "@/modules/purchase/purchase.validation";
import { usePurchaseStore } from "@/stores/transactions/usePurchaseStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";

type InvoiceMetaFormField = z.infer<typeof invoiceMetaValidation>;

export default function InvoiceMeta() {
  const createPurchaseMutation = useCreatePurchaseMutation();
  const cart = usePurchaseStore((state) => state.cart);
  const methods = useForm<InvoiceMetaFormField>({
    defaultValues: {
      invoice_value: 0,
      discount: 0,
      total: 0,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(invoiceMetaValidation),
  });

  const onSubmit = (data: InvoiceMetaFormField) => {
    createPurchaseMutation.mutate({
      client_id: usePurchaseStore.getState().invoice_information.client,
      invoice_number:
        usePurchaseStore.getState().invoice_information.invoice_number,
      invoice_date: usePurchaseStore.getState().invoice_information
        .invoice_date as string,
      cart,
      invoice_value: data.invoice_value,
      discount: data.discount,
      total: data.total,
    });
  };

  const { handleSubmit, setValue, control } = methods;

  const watchedDiscount = useWatch({
    control,
    name: "discount",
  });

  useEffect(() => {
    const invoice_value = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
    const total = invoice_value - (watchedDiscount * invoice_value) / 100;

    setValue("invoice_value", invoice_value, { shouldValidate: true });
    setValue("total", total, { shouldValidate: true });
  }, [cart, watchedDiscount, setValue]);

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
            <Button type="submit" disabled={createPurchaseMutation.isPending}>
              {createPurchaseMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
