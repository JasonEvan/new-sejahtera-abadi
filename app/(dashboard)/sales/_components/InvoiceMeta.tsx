import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { invoiceMetaValidation } from "@/modules/sale/sale.validation";
import { useSaleStore } from "@/stores/transactions/useSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";

type InvoiceMetaFormField = z.infer<typeof invoiceMetaValidation>;

export default function InvoiceMeta() {
  const cart = useSaleStore((state) => state.cart);
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
    console.log(data);
  };

  const { control, handleSubmit, setValue } = methods;

  const watchedDiscount = useWatch({
    control,
    name: "discount",
  });

  useEffect(() => {
    const invoice_value = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
    const total = invoice_value - (watchedDiscount * invoice_value) / 100;

    setValue("invoice_value", invoice_value);
    setValue("total", total);
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
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
