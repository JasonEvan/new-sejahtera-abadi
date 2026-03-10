import ComboboxField from "@/components/shared/ComboboxField";
import { DataTable } from "@/components/shared/DataTable";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useSalesPaymentStore } from "@/stores/payments/useSalesPaymentStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useColumns } from "./columns";
import { createSalesPaymentValidation } from "@/modules/sales-payment/sales-payment.validation";
import { SalesPaymentFormField } from "@/modules/sales-payment/sales-payment.types";
import { useGetOrdersMenu } from "@/modules/sale/sale.queries";
import { useSalesPaymentMutation } from "@/modules/sales-payment/sales-payment.mutations";

export default function ReceivablesTable() {
  const salesPaymentMutation = useSalesPaymentMutation();
  const clientId = useSalesPaymentStore(
    (state) => state.transaction_information.client,
  );
  const {
    data: invoices,
    isError,
    error,
  } = useGetOrdersMenu({
    clientId,
    isPaidOff: false,
  });
  const cart = useSalesPaymentStore((state) => state.cart);
  const columns = useColumns();

  const schema = useMemo(() => createSalesPaymentValidation(cart), [cart]);

  const methods = useForm<SalesPaymentFormField>({
    defaultValues: {
      sales_order_id: 0,
      balance_due: undefined,
      paid_amount: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const { setValue, handleSubmit, reset, setFocus, control } = methods;

  const onSubmit = (data: SalesPaymentFormField) => {
    useSalesPaymentStore.getState().addToCart({
      id: crypto.randomUUID(),
      invoice_number:
        invoices?.find((item) => item.id === data.sales_order_id)?.name || "",
      balance_due: data.balance_due,
      paid_amount: data.paid_amount,
      sales_order_id: data.sales_order_id,
    });

    setFocus("sales_order_id");
    reset();
  };

  function handleCreatePayment() {
    salesPaymentMutation.mutate({
      client_id: clientId,
      transaction_date:
        useSalesPaymentStore.getState().transaction_information
          .transaction_date,
      transaction_number:
        useSalesPaymentStore.getState().transaction_information
          .transaction_number,
      cart: cart,
    });
  }

  const watchedOrderId = useWatch({
    control,
    name: "sales_order_id",
  });

  useEffect(() => {
    if (watchedOrderId) {
      const selectedInvoice = invoices?.find(
        (item) => item.id === watchedOrderId,
      );

      if (selectedInvoice) {
        setValue("balance_due", selectedInvoice.balance_due);
      }
    }
  }, [watchedOrderId, invoices, setValue]);

  useEffect(() => {
    if (isError) {
      toast.error(error?.message || "Failed to fetch invoices", {
        position: "bottom-right",
      });
    }
  }, [isError, error]);

  return (
    <div className="space-y-5">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-3 gap-x-2">
            <ComboboxField
              name="sales_order_id"
              label="Nomor Nota"
              items={invoices || []}
            />
            <InputField
              name="balance_due"
              label="Saldo Nota"
              type="number"
              disabled
            />
            <InputField name="paid_amount" label="Lunas Nota" type="number" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="cursor-pointer">
              Add
            </Button>
          </div>
        </form>
      </FormProvider>
      <DataTable columns={columns} data={cart} />
      <div className="flex justify-end">
        <Button
          className="cursor-pointer"
          onClick={handleCreatePayment}
          disabled={salesPaymentMutation.isPending}
        >
          {salesPaymentMutation.isPending ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
