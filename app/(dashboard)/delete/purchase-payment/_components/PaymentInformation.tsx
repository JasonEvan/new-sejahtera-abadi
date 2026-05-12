"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { Button } from "@/components/ui/button";
import { useGetClientNames } from "@/modules/client/client.queries";
import {
  useGetPurchasePaymentTransactions,
  useGetPurchasePaymentTransactionSummary,
} from "@/modules/purchase-payment/purchase-payment.queries";
import { useDeletePurchasePaymentStore } from "@/stores/payments/useDeletePurchasePaymentStore";
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

const paymentInformationValidation = z.object({
  client: z.number().min(1, "Pilih klien"),
  transaction_id: z.number().min(1, "Pilih nomor transaksi"),
});

type PaymentInformationFormField = z.infer<typeof paymentInformationValidation>;

export default function PaymentInformation() {
  const { data: clients } = useGetClientNames();
  const transactionInformation = useDeletePurchasePaymentStore(
    (state) => state.transaction_information,
  );

  const methods = useForm<PaymentInformationFormField>({
    defaultValues: {
      client: 0,
      transaction_id: 0,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(paymentInformationValidation),
  });

  const { reset, handleSubmit, control } = methods;

  const watchedClient = useWatch({ control, name: "client" });
  const watchedTransactionId = useWatch({
    control,
    name: "transaction_id",
  });

  const { data: transactions } = useGetPurchasePaymentTransactions(
    watchedClient,
    !!watchedClient,
  );

  const { data: transactionSummary, isLoading } =
    useGetPurchasePaymentTransactionSummary(
      transactions?.find((t) => t.id === watchedTransactionId)?.name || "",
      !!watchedTransactionId,
    );

  const onSubmit = (data: PaymentInformationFormField) => {
    if (!transactionSummary) {
      toast.error("Data transaksi belum dimuat, coba lagi", {
        position: "bottom-right",
      });
      return;
    }

    useDeletePurchasePaymentStore.getState().setTransactionInformation({
      client: data.client,
      transaction_id: data.transaction_id,
    });

    useDeletePurchasePaymentStore.getState().setMeta({
      transaction_number: transactionSummary.transaction_number,
      payment_date: transactionSummary.payment_date,
      total_paid: transactionSummary.total_paid,
      invoice_count: transactionSummary.invoice_count,
    });
  };

  const handleReset = () => {
    useDeletePurchasePaymentStore.getState().clear();
    reset({
      client: 0,
      transaction_id: 0,
    });
  };

  useEffect(() => {
    reset({
      client: transactionInformation.client,
      transaction_id: transactionInformation.transaction_id,
    });
  }, [transactionInformation, reset]);

  const isLocked = !!transactionInformation.transaction_id;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Pilih Transaksi Pembayaran</CardTitle>
            <CardDescription>
              Pilih klien dan nomor transaksi pembayaran yang ingin dihapus
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
              name="transaction_id"
              label="Nomor Transaksi"
              placeholder="Pilih nomor transaksi"
              items={transactions || []}
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
