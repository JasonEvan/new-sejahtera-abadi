import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useCreateSaleMutation } from "@/modules/sale/sale.mutations";
import { invoiceMetaValidation } from "@/modules/sale/sale.validation";
import { useSaleStore } from "@/stores/transactions/useSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";

type InvoiceMetaFormField = z.infer<typeof invoiceMetaValidation>;

export default function InvoiceMeta() {
  const createSaleMutation = useCreateSaleMutation();
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
    createSaleMutation.mutate({
      client_id: useSaleStore.getState().invoice_information.client,
      salesman_id: useSaleStore.getState().invoice_information.salesman,
      invoice_number:
        useSaleStore.getState().invoice_information.invoice_number,
      invoice_date: dayjs(
        useSaleStore.getState().invoice_information.invoice_date,
      ).toISOString(),
      cart: cart,
      invoice_value: data.invoice_value,
      discount: data.discount,
      total: data.total,
    });
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
            <Button type="submit" disabled={createSaleMutation.isPending}>
              {createSaleMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
