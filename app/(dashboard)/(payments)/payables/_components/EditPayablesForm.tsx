"use client";

import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import {
  EditPurchasePaymentFormField,
  PurchasePaymentTableRow,
} from "@/modules/purchase-payment/purchase-payment.types";
import { editPurchasePaymentValidation } from "@/modules/purchase-payment/purchase-payment.validation";
import { usePurchasePaymentStore } from "@/stores/payments/usePurchasePaymentStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";

export default function EditPayablesForm({
  row,
}: {
  row: PurchasePaymentTableRow;
}) {
  const schema = useMemo(
    () => editPurchasePaymentValidation(row.balance_due),
    [row.balance_due],
  );

  const methods = useForm<EditPurchasePaymentFormField>({
    defaultValues: {
      paid_amount: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: EditPurchasePaymentFormField) => {
    usePurchasePaymentStore.getState().updateCart(row.id, {
      ...row,
      paid_amount: data.paid_amount,
    });
    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        id="edit-payables-payment-form"
      >
        <div>
          <InputField name="paid_amount" label="Lunas Nota" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
