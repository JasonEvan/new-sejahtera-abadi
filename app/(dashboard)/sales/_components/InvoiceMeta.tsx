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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID").format(value || 0);
};

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

  const [watchedInvoiceValue, watchedDiscount, watchedTotal] = useWatch({
    control,
    name: ["invoice_value", "discount", "total"],
  });

  useEffect(() => {
    const invoice_value = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
    const discountValue = Number(watchedDiscount) || 0;
    const total = Math.round(
      invoice_value - (discountValue * invoice_value) / 100,
    );

    setValue("invoice_value", invoice_value, { shouldValidate: true });
    setValue("total", total, { shouldValidate: true });
  }, [cart, watchedDiscount, setValue]);

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
              disabled={createSaleMutation.isPending}
            >
              {createSaleMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
