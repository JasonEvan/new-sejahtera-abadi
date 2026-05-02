"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { Button } from "@/components/ui/button";
import { useGetClientNames } from "@/modules/client/client.queries";
import {
  useGetReturnEligibleOrders,
  useGetSaleReturnLines,
} from "@/modules/sale/sale.queries";
import { useEditSaleStore } from "@/stores/transactions/useEditSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { useEffect } from "react";

const invoiceInformationValidation = z.object({
  client: z.int().min(1, "Pilih klien"),
  sales_order_id: z.int().min(1, "Pilih nomor nota"),
});

type InvoiceInformationFormField = z.infer<typeof invoiceInformationValidation>;

export default function InvoiceInformation() {
  const { data: clients } = useGetClientNames();
  const invoiceInformation = useEditSaleStore(
    (state) => state.invoice_information,
  );

  const methods = useForm<InvoiceInformationFormField>({
    defaultValues: {
      client: 0,
      sales_order_id: 0,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(invoiceInformationValidation),
  });

  const { reset, handleSubmit, control } = methods;

  const watchedClient = useWatch({ control, name: "client" });
  const watchedSalesOrderId = useWatch({ control, name: "sales_order_id" });

  const { data: eligibleOrders } = useGetReturnEligibleOrders(
    watchedClient,
    !!watchedClient,
  );

  const selectedInvoiceNumber = eligibleOrders?.find(
    (order) => order.id === watchedSalesOrderId,
  )?.name;

  const { data: invoiceLineData } = useGetSaleReturnLines(
    selectedInvoiceNumber ?? "",
    !!selectedInvoiceNumber,
  );

  const onSubmit = (data: InvoiceInformationFormField) => {
    if (!invoiceLineData || !selectedInvoiceNumber) {
      toast.error("Data nota belum dimuat, coba lagi", {
        position: "bottom-right",
      });
      return;
    }

    useEditSaleStore.getState().setInvoiceInformation({
      client: data.client,
      sales_order_id: data.sales_order_id,
      invoice_number: selectedInvoiceNumber,
    });

    useEditSaleStore.getState().setItemsFromInvoice(invoiceLineData.lines);
    useEditSaleStore.getState().setMeta(invoiceLineData.meta);
  };

  const handleReset = () => {
    useEditSaleStore.getState().clear();
    reset({
      client: 0,
      sales_order_id: 0,
    });
  };

  useEffect(() => {
    reset({
      client: invoiceInformation.client,
      sales_order_id: invoiceInformation.sales_order_id,
    });
  }, [invoiceInformation, reset]);

  const isLocked = !!invoiceInformation.sales_order_id;

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
            placeholder="Pilih nomor nota"
            items={eligibleOrders || []}
            disabled={isLocked || !watchedClient}
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
