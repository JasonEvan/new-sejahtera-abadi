"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useGetClientNames } from "@/modules/client/client.queries";
import {
  useGetReturnEligibleOrders,
  useGetSaleReturnLines,
} from "@/modules/sale/sale.queries";
import { returnTransactionValidation } from "@/modules/sales-return/sales-return.validation";
import { useSaleReturnStore } from "@/stores/transactions/useSaleReturnStore";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type ReturnTransactionFormField = z.infer<typeof returnTransactionValidation>;

export default function TransactionInformation() {
  const { data: clients } = useGetClientNames();
  const transactionInfo = useSaleReturnStore(
    (state) => state.transaction_information,
  );

  const methods = useForm<ReturnTransactionFormField>({
    defaultValues: {
      client: 0,
      sales_order_id: 0,
      return_date: dayjs().format("YYYY-MM-DD"),
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(returnTransactionValidation),
  });

  const { reset, handleSubmit, control } = methods;

  const watchedClient = useWatch({ control, name: "client" });
  const watchedSalesOrderId = useWatch({ control, name: "sales_order_id" });

  const { data: eligibleOrders } = useGetReturnEligibleOrders(
    watchedClient,
    !!watchedClient,
  );

  const selectedInvoiceNumber = eligibleOrders?.find(
    (o) => o.id === watchedSalesOrderId,
  )?.name;

  const { data: returnLineData } = useGetSaleReturnLines(
    selectedInvoiceNumber ?? "",
    !!selectedInvoiceNumber,
  );

  const onSubmit = (data: ReturnTransactionFormField) => {
    if (!returnLineData) {
      toast.error("Data nota belum dimuat, coba lagi", {
        position: "bottom-right",
      });
      return;
    }

    const invoiceNumber = selectedInvoiceNumber!;

    useSaleReturnStore.getState().setTransactionInformation({
      client: data.client,
      sales_order_id: data.sales_order_id,
      invoice_number: invoiceNumber,
      return_date: data.return_date,
    });
    useSaleReturnStore.getState().setLines(returnLineData.lines);
    useSaleReturnStore.getState().setMeta(returnLineData.meta);
  };

  const handleReset = () => {
    useSaleReturnStore.getState().clear();
    reset({
      client: 0,
      sales_order_id: 0,
      return_date: dayjs().format("YYYY-MM-DD"),
    });
  };

  useEffect(() => {
    if (transactionInfo.sales_order_id) {
      reset({
        client: transactionInfo.client,
        sales_order_id: transactionInfo.sales_order_id,
        return_date: dayjs(transactionInfo.return_date).format("YYYY-MM-DD"),
      });
    }
  }, [transactionInfo, reset]);

  const isLocked = !!transactionInfo.sales_order_id;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-x-2">
          <ComboboxField
            name="client"
            label="Nama Client"
            placeholder="Pilih klien"
            items={clients || []}
            disabled={isLocked}
          />
          <ComboboxField
            name="sales_order_id"
            label="Nomor Nota"
            placeholder="Pilih nota"
            items={eligibleOrders || []}
            disabled={isLocked || !watchedClient}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-2">
          <InputField
            name="return_date"
            label="Tanggal Retur"
            type="date"
            disabled={isLocked}
          />
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
