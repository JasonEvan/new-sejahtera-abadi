"use client";

import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useCreateSaleReturnMutation } from "@/modules/sale/sale.mutations";
import { useSaleReturnStore } from "@/stores/transactions/useSaleReturnStore";
import dayjs from "dayjs";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

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

  const { setValue, handleSubmit } = methods;

  useEffect(() => {
    const return_value = lines.reduce(
      (acc, l) => acc + l.price * l.return_qty,
      0,
    );
    const total =
      (meta.invoice_value - return_value) * (1 - meta.discount / 100);
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-x-2">
            <InputField
              name="return_value"
              label="Nilai Retur"
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
            <InputField name="discount" label="Diskon" type="number" disabled />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={createReturnMutation.isPending}>
              {createReturnMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
