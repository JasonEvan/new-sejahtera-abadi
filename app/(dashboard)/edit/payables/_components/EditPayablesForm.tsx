"use client";

import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

export interface EditablePayableRow {
  id: string;
  transaction_number: string;
  payment_date: string;
  invoice_number: string;
  paid_amount: number;
  balance_due: number;
}

interface EditPayablesFormField {
  paid_amount: number;
}

export default function EditPayablesForm({
  row,
  invoiceValue,
  onSave,
}: {
  row: EditablePayableRow;
  invoiceValue: number;
  onSave: (id: string, paidAmount: number) => void;
}) {
  const schema = useMemo(
    () =>
      z.object({
        paid_amount: z
          .int("Lunas nota harus berupa angka bulat")
          .min(0, "Lunas nota tidak boleh negatif")
          .max(invoiceValue, "Lunas nota tidak boleh melebihi nilai nota"),
      }),
    [invoiceValue],
  );

  const methods = useForm<EditPayablesFormField>({
    defaultValues: {
      paid_amount: row.paid_amount,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: EditPayablesFormField) => {
    onSave(row.id, data.paid_amount);
    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        id="edit-payables-by-invoice-form"
      >
        <div>
          <InputField name="paid_amount" label="Lunas Nota" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
