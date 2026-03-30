"use client";

import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useUpdatePurchaseReturnMutation } from "@/modules/purchase-return/purchase-return.mutations";
import { useEditPurchaseReturnStore } from "@/stores/transactions/useEditPurchaseReturnStore";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

type PurchasesMetaFormField = {
  return_value: number;
  discount: number;
  total: number;
};

export default function PurchasesMetadata() {
  const lines = useEditPurchaseReturnStore((state) => state.lines);
  const meta = useEditPurchaseReturnStore((state) => state.meta);
  const transactionInfo = useEditPurchaseReturnStore(
    (state) => state.transaction_information,
  );
  const updatePurchaseReturnMutation = useUpdatePurchaseReturnMutation();

  const methods = useForm<PurchasesMetaFormField>({
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
    if (!transactionInfo.invoice_number) {
      toast.error("Pilih nota terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }

    const returnableLines = lines.filter((line) => line.return_qty > 0);
    if (returnableLines.length === 0) {
      toast.error("Pilih minimal 1 item untuk diretur", {
        position: "bottom-right",
      });
      return;
    }

    updatePurchaseReturnMutation.mutate({
      invoice_number: transactionInfo.invoice_number,
      return_date: transactionInfo.return_date,
      lines: lines.map((line) => ({
        purchase_order_line_id: line.id,
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
            <Button
              type="submit"
              disabled={updatePurchaseReturnMutation.isPending}
            >
              {updatePurchaseReturnMutation.isPending
                ? "Submitting..."
                : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
