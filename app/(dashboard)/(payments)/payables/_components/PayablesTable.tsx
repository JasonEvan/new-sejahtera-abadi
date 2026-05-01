import ComboboxField from "@/components/shared/ComboboxField";
import { DataTable } from "@/components/shared/DataTable";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { PurchasePaymentFormField } from "@/modules/purchase-payment/purchase-payment.types";
import { createPurchasePaymentValidation } from "@/modules/purchase-payment/purchase-payment.validation";
import { usePurchasePaymentStore } from "@/stores/payments/usePurchasePaymentStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useColumns } from "./columns";
import { useGetOrdersMenu } from "@/modules/purchase/purchase.queries";
import { toast } from "sonner";
import { usePurchasePaymentMutation } from "@/modules/purchase-payment/purchase-payment.mutations";

export default function PayablesTable() {
  const clientId = usePurchasePaymentStore(
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
  const purchasePaymentMutation = usePurchasePaymentMutation();
  const cart = usePurchasePaymentStore((state) => state.cart);
  const columns = useColumns();

  const schema = useMemo(() => createPurchasePaymentValidation(cart), [cart]);

  const methods = useForm<PurchasePaymentFormField>({
    defaultValues: {
      purchase_order_id: 0,
      balance_due: undefined,
      paid_amount: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const { setValue, handleSubmit, reset, setFocus, control } = methods;

  const onSubmit = (data: PurchasePaymentFormField) => {
    usePurchasePaymentStore.getState().addToCart({
      id: crypto.randomUUID(),
      invoice_number:
        invoices?.find((item) => item.id === data.purchase_order_id)?.name ||
        "",
      balance_due: data.balance_due,
      paid_amount: data.paid_amount,
      purchase_order_id: data.purchase_order_id,
    });

    setFocus("purchase_order_id");
    reset();
  };

  const handlePayFull = () => {
    const balanceDue = methods.getValues("balance_due");
    const purchaseOrderId = methods.getValues("purchase_order_id");

    if (!purchaseOrderId) {
      toast.error("Pilih nota terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }

    if (balanceDue === undefined || balanceDue === null) {
      toast.error("Saldo nota tidak ditemukan", {
        position: "bottom-right",
      });
      return;
    }

    setValue("paid_amount", balanceDue, { shouldValidate: true });
    handleSubmit(onSubmit)();
  };

  function handleCreatePayment() {
    purchasePaymentMutation.mutate({
      client_id: clientId,
      transaction_date:
        usePurchasePaymentStore.getState().transaction_information
          .transaction_date,
      transaction_number:
        usePurchasePaymentStore.getState().transaction_information
          .transaction_number,
      cart: cart,
    });
  }

  const watchedOrderId = useWatch({
    control,
    name: "purchase_order_id",
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
              name="purchase_order_id"
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handlePayFull}
            >
              Add Full Payment
            </Button>
            <Button type="submit" className="cursor-pointer">
              Add
            </Button>
          </div>
        </form>
      </FormProvider>
      <DataTable columns={columns} data={cart} maxHeight="500px" />
      <div className="flex justify-end">
        <Button
          className="cursor-pointer"
          onClick={handleCreatePayment}
          disabled={purchasePaymentMutation.isPending || cart.length === 0}
        >
          {purchasePaymentMutation.isPending ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
