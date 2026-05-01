"use client";

import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useUpdateSaleReturnMutation } from "@/modules/sales-return/sales-return.mutations";
import { useEditSaleReturnStore } from "@/stores/transactions/useEditSaleReturnStore";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

type SalesMetaFormField = {
  return_value: number;
  discount: number;
  total: number;
};

export default function SalesMetadata() {
  const lines = useEditSaleReturnStore((state) => state.lines);
  const meta = useEditSaleReturnStore((state) => state.meta);
  const transactionInfo = useEditSaleReturnStore(
    (state) => state.transaction_information,
  );
  const updateSaleReturnMutation = useUpdateSaleReturnMutation();

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
      (acc, line) => acc + line.price * line.return_qty,
      0,
    );
    const total =
      (meta.invoice_value - return_value) * (1 - meta.discount / 100);

    setValue("return_value", return_value);
    setValue("discount", meta.discount);
    setValue("total", total);
  }, [lines, meta.invoice_value, meta.discount, setValue]);

  const onSubmit = () => {
    if (!transactionInfo.sales_return_id) {
      toast.error("Pilih nota terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }

    // const returnableLines = lines.filter((line) => line.return_qty > 0);
    // if (returnableLines.length === 0) {
    //   toast.error("Pilih minimal 1 item untuk diretur", {
    //     position: "bottom-right",
    //   });
    //   return;
    // }

    updateSaleReturnMutation.mutate({
      sales_return_id: transactionInfo.sales_return_id,
      return_date: transactionInfo.return_date,
      lines: lines.map((line) => ({
        sales_order_line_id: line.id,
        return_qty: line.return_qty,
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
            <Button type="submit" disabled={updateSaleReturnMutation.isPending}>
              {updateSaleReturnMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
