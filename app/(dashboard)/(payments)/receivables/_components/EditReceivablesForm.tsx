"use client";

import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import {
  EditSalesPaymentFormField,
  SalesPaymentTableRow,
} from "@/modules/sales-payment/sales-payment.types";
import { editSalesPaymentValidation } from "@/modules/sales-payment/sales-payment.validation";
import { useSalesPaymentStore } from "@/stores/payments/useSalesPaymentStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";

export default function EditReceivablesForm({
  row,
}: {
  row: SalesPaymentTableRow;
}) {
  const schema = useMemo(
    () => editSalesPaymentValidation(row.balance_due),
    [row.balance_due],
  );

  const methods = useForm<EditSalesPaymentFormField>({
    defaultValues: {
      paid_amount: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: EditSalesPaymentFormField) => {
    useSalesPaymentStore.getState().updateCart(row.id, {
      ...row,
      paid_amount: data.paid_amount,
    });
    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        id="edit-receivables-payment-form"
      >
        <div>
          <InputField name="paid_amount" label="Lunas Nota" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
