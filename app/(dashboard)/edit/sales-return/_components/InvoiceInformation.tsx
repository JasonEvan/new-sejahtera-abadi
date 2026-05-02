"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { Button } from "@/components/ui/button";
import {
  useGetEditSaleReturnDetail,
  useGetEditSaleReturnInvoices,
  useGetReturnHistory,
} from "@/modules/sales-return/sales-return.queries";
import { useEditSaleReturnStore } from "@/stores/transactions/useEditSaleReturnStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const invoiceInformationValidation = z.object({
  sales_order_id: z.number().min(1, "Pilih nomor nota"),
  sales_return_id: z.number().min(1, "Pilih tanggal retur"),
});

type InvoiceInformationFormField = z.infer<typeof invoiceInformationValidation>;

export default function InvoiceInformation() {
  const { data: invoices } = useGetEditSaleReturnInvoices();
  const transactionInfo = useEditSaleReturnStore(
    (state) => state.transaction_information,
  );

  const methods = useForm<InvoiceInformationFormField>({
    defaultValues: {
      sales_order_id: 0,
      sales_return_id: 0,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(invoiceInformationValidation),
  });

  const { reset, handleSubmit, control } = methods;

  const watchedSalesOrderId = useWatch({
    control,
    name: "sales_order_id",
  });

  const watchedSalesReturnId = useWatch({
    control,
    name: "sales_return_id",
  });

  const { data: returnHistory } = useGetReturnHistory(
    watchedSalesOrderId,
    !!watchedSalesOrderId,
  );

  const { data: detailData } = useGetEditSaleReturnDetail(
    watchedSalesReturnId,
    !!watchedSalesReturnId,
  );

  const onSubmit = () => {
    if (!detailData) {
      toast.error("Data retur belum dimuat, coba lagi", {
        position: "bottom-right",
      });
      return;
    }

    useEditSaleReturnStore
      .getState()
      .setTransactionInformation(detailData.transaction_information);
    useEditSaleReturnStore.getState().setLines(detailData.lines);
    useEditSaleReturnStore.getState().setMeta(detailData.meta);
  };

  const handleReset = () => {
    useEditSaleReturnStore.getState().clear();
    reset({
      sales_order_id: 0,
      sales_return_id: 0,
    });
  };

  useEffect(() => {
    reset({
      sales_order_id: transactionInfo.sales_order_id,
      sales_return_id: transactionInfo.sales_return_id,
    });
  }, [transactionInfo, reset]);

  const isLocked = !!transactionInfo.sales_order_id;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-x-2">
          <ComboboxField
            name="sales_order_id"
            label="Nomor Nota"
            placeholder="Pilih nomor nota"
            items={invoices || []}
            disabled={isLocked}
          />
          {watchedSalesOrderId > 0 && (
            <ComboboxField
              name="sales_return_id"
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
