"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { Button } from "@/components/ui/button";
import {
  useGetEditPurchaseReturnDetail,
  useGetEditPurchaseReturnInvoices,
  useGetReturnHistory,
} from "@/modules/purchase-return/purchase-return.queries";
import { useEditPurchaseReturnStore } from "@/stores/transactions/useEditPurchaseReturnStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const invoiceInformationValidation = z.object({
  purchase_order_id: z.number().min(1, "Pilih nomor nota"),
  purchase_return_id: z.number().min(1, "Pilih tanggal retur"),
});

type InvoiceInformationFormField = z.infer<typeof invoiceInformationValidation>;

export default function InvoiceInformation() {
  const { data: invoices } = useGetEditPurchaseReturnInvoices();
  const transactionInfo = useEditPurchaseReturnStore(
    (state) => state.transaction_information,
  );

  const methods = useForm<InvoiceInformationFormField>({
    defaultValues: {
      purchase_order_id: 0,
      purchase_return_id: 0,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(invoiceInformationValidation),
  });

  const { reset, handleSubmit, control } = methods;

  const watchedPurchaseOrderId = useWatch({
    control,
    name: "purchase_order_id",
  });

  const watchedPurchaseReturnId = useWatch({
    control,
    name: "purchase_return_id",
  });

  const { data: returnHistory } = useGetReturnHistory(
    watchedPurchaseOrderId,
    !!watchedPurchaseOrderId,
  );

  const { data: detailData } = useGetEditPurchaseReturnDetail(
    watchedPurchaseReturnId,
    !!watchedPurchaseReturnId,
  );

  const onSubmit = () => {
    if (!detailData) {
      toast.error("Data retur belum dimuat, coba lagi", {
        position: "bottom-right",
      });
      return;
    }

    useEditPurchaseReturnStore
      .getState()
      .setTransactionInformation(detailData.transaction_information);
    useEditPurchaseReturnStore.getState().setLines(detailData.lines);
    useEditPurchaseReturnStore.getState().setMeta(detailData.meta);
  };

  const handleReset = () => {
    useEditPurchaseReturnStore.getState().clear();
    reset({
      purchase_order_id: 0,
      purchase_return_id: 0,
    });
  };

  useEffect(() => {
    reset({
      purchase_order_id: transactionInfo.purchase_order_id,
      purchase_return_id: transactionInfo.purchase_return_id,
    });
  }, [transactionInfo, reset]);

  const isLocked = !!transactionInfo.purchase_order_id;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-x-2">
          <ComboboxField
            name="purchase_order_id"
            label="Nomor Nota"
            placeholder="Pilih nomor nota"
            items={invoices || []}
            disabled={isLocked}
          />
          {watchedPurchaseOrderId > 0 && (
            <ComboboxField
              name="purchase_return_id"
              label="Tanggal Retur"
              placeholder="Pilih tanggal retur"
              items={returnHistory || []}
              disabled={isLocked}
            />
          )}
        </div>
        <div className="flex justify-end gap-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            className="cursor-pointer"
          >
            Reset
          </Button>
          <Button type="submit" disabled={isLocked} className="cursor-pointer">
            Next
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
