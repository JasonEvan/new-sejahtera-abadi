"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { Button } from "@/components/ui/button";
import { useGetClientNames } from "@/modules/client/client.queries";
import { useGetReturnHistory } from "@/modules/sales-return/sales-return.queries";
import { useGetOrdersMenu } from "@/modules/sale/sale.queries";
import { useDeleteSalesReturnStore } from "@/stores/returns/useDeleteSalesReturnStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
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

const returnInformationValidation = z.object({
  client: z.number().min(1, "Pilih klien"),
  sales_order_id: z.number().min(1, "Pilih nomor nota"),
  sales_return_id: z.number().min(1, "Pilih tanggal retur"),
});

type ReturnInformationFormField = z.infer<typeof returnInformationValidation>;

export default function ReturnInformation() {
  const { data: clients } = useGetClientNames();
  const transactionInformation = useDeleteSalesReturnStore(
    (state) => state.transaction_information,
  );

  const methods = useForm<ReturnInformationFormField>({
    defaultValues: {
      client: 0,
      sales_order_id: 0,
      sales_return_id: 0,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(returnInformationValidation),
  });

  const { reset, handleSubmit, control } = methods;

  const watchedClient = useWatch({ control, name: "client" });
  const watchedSalesOrderId = useWatch({ control, name: "sales_order_id" });

  const { data: orders } = useGetOrdersMenu({
    clientId: watchedClient,
    isPaidOff: false,
  });
  const { data: returns } = useGetReturnHistory(
    watchedSalesOrderId,
    !!watchedSalesOrderId,
  );

  const onSubmit = (data: ReturnInformationFormField) => {
    const selectedOrder = orders?.find((o) => o.id === data.sales_order_id);

    useDeleteSalesReturnStore.getState().setTransactionInformation({
      client: data.client,
      sales_order_id: data.sales_order_id,
      sales_return_id: data.sales_return_id,
      invoice_number: selectedOrder?.name || "",
      return_date: "", // Will be fetched in summary
    });
  };

  const handleClear = () => {
    useDeleteSalesReturnStore.getState().clear();
    reset({
      client: 0,
      sales_order_id: 0,
      sales_return_id: 0,
    });
  };

  useEffect(() => {
    reset({
      client: transactionInformation.client,
      sales_order_id: transactionInformation.sales_order_id,
      sales_return_id: transactionInformation.sales_return_id,
    });
  }, [transactionInformation, reset]);

  const isLocked = !!transactionInformation.sales_return_id;

  const returnOptions = returns || [];

  return (
    <FormProvider {...methods}>
      <Card className="border-none shadow-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Informasi Retur</CardTitle>
          <CardDescription>
            Pilih klien, nota, dan tanggal retur yang ingin dihapus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ComboboxField
                name="client"
                label="Nama Klien"
                placeholder="Pilih klien"
                items={clients || []}
                disabled={isLocked}
              />
              <ComboboxField
                name="sales_order_id"
                label="Nomor Nota"
                placeholder="Pilih nota"
                items={orders || []}
                disabled={isLocked || !watchedClient}
              />
              <ComboboxField
                name="sales_return_id"
                label="Tanggal Retur"
                placeholder="Pilih tanggal retur"
                items={returnOptions}
                disabled={isLocked || !watchedSalesOrderId}
              />
            </div>
            {!isLocked && (
              <div className="flex justify-end">
                <Button type="submit" className="px-8 cursor-pointer">
                  Cek Data Retur
                </Button>
              </div>
            )}
          </form>
        </CardContent>
        {isLocked && (
          <CardFooter className="flex justify-end border-t border-gray-100 dark:border-white/10 pt-6">
            <Button
              variant="outline"
              onClick={handleClear}
              className="cursor-pointer"
            >
              Ganti Transaksi
            </Button>
          </CardFooter>
        )}
      </Card>
    </FormProvider>
  );
}
