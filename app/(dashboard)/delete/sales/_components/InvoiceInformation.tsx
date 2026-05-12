"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { Button } from "@/components/ui/button";
import { useGetClientNames } from "@/modules/client/client.queries";
import {
  useGetReturnEligibleOrders,
  useGetSaleReturnLines,
} from "@/modules/sale/sale.queries";
import { useDeleteSaleStore } from "@/stores/transactions/useDeleteSaleStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect } from "react";

const invoiceInformationValidation = z.object({
  client: z.number().min(1, "Pilih klien"),
  sales_order_id: z.number().min(1, "Pilih nomor nota"),
});

type InvoiceInformationFormField = z.infer<typeof invoiceInformationValidation>;

export default function InvoiceInformation() {
  const { data: clients } = useGetClientNames();
  const invoiceInformation = useDeleteSaleStore(
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

  const { data: invoiceLineData, isLoading } = useGetSaleReturnLines(
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

    useDeleteSaleStore.getState().setInvoiceInformation({
      client: data.client,
      sales_order_id: data.sales_order_id,
      invoice_number: selectedInvoiceNumber,
    });

    useDeleteSaleStore.getState().setMeta({
      invoice_value: invoiceLineData.meta.invoice_value,
      discount: invoiceLineData.meta.discount,
      total: invoiceLineData.meta.total,
      product_count: invoiceLineData.lines.length,
    });
  };

  const handleReset = () => {
    useDeleteSaleStore.getState().clear();
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Pilih Nota</CardTitle>
            <CardDescription>
              Pilih klien dan nomor nota yang ingin dihapus
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              className="cursor-pointer"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isLocked || isLoading}
              className="cursor-pointer"
            >
              {isLoading ? "Loading..." : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
