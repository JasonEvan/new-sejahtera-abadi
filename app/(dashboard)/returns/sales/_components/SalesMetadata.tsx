"use client";

import { Button } from "@/components/ui/button";
import { useCreateSaleReturnMutation } from "@/modules/sale/sale.mutations";
import { useSaleReturnStore } from "@/stores/transactions/useSaleReturnStore";
import dayjs from "dayjs";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID").format(value || 0);
};

type SalesMetaFormField = {
  return_value: number;
  discount: number;
  total: number;
};

export default function SalesMetadata() {
  const lines = useSaleReturnStore((state) => state.lines);
  const meta = useSaleReturnStore((state) => state.meta);
  const transactionInfo = useSaleReturnStore(
    (state) => state.transaction_information,
  );
  const createReturnMutation = useCreateSaleReturnMutation();

  const methods = useForm<SalesMetaFormField>({
    defaultValues: {
      return_value: 0,
      discount: 0,
      total: 0,
    },
  });

  const { setValue, handleSubmit, control } = methods;

  const [watchedReturnValue, watchedDiscount, watchedTotal] = useWatch({
    control,
    name: ["return_value", "discount", "total"],
  });

  useEffect(() => {
    const return_value = lines.reduce(
      (acc, l) => acc + l.price * l.return_qty,
      0,
    );
    const total = Math.round(
      (meta.invoice_value - return_value) * (1 - meta.discount / 100),
    );
    setValue("return_value", return_value);
    setValue("discount", meta.discount);
    setValue("total", total);
  }, [lines, meta.invoice_value, meta.discount, setValue]);

  const onSubmit = () => {
    const returnableLines = lines.filter((l) => l.return_qty > 0);
    if (returnableLines.length === 0) {
      toast.error("Pilih minimal 1 item untuk diretur", {
        position: "bottom-right",
      });
      return;
    }

    createReturnMutation.mutate({
      client_id: transactionInfo.client,
      sales_order_id: transactionInfo.sales_order_id,
      return_date: dayjs(transactionInfo.return_date).toISOString(),
      lines: returnableLines.map((l) => ({
        sales_order_line_id: l.id,
        return_qty: l.return_qty,
      })),
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
                {formatCurrency(meta.invoice_value)}
              </span>
            </div>

            <div className="flex justify-between w-full max-w-[300px] items-center">
              <span className="text-muted-foreground font-medium">
                Nilai Retur
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(watchedReturnValue as number)}
              </span>
            </div>

            <div className="flex justify-between w-full max-w-[300px] items-center">
              <span className="text-muted-foreground font-medium">
                Diskon (%)
              </span>
              <span className="text-lg font-semibold text-foreground">
                {watchedDiscount}%
              </span>
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
              disabled={createReturnMutation.isPending}
            >
              {createReturnMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
