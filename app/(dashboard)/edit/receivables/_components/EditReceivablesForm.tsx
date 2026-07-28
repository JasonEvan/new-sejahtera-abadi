"use client";

import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

export interface EditableReceivableRow {
  id: string;
  transaction_number: string;
  payment_date: string;
  invoice_number: string;
  invoice_value: number;
  paid_amount: number;
  balance_due: number;
}

interface EditReceivablesFormField {
  paid_amount: number;
}

export default function EditReceivablesForm({
  row,
  invoiceValue,
  onSave,
}: {
  row: EditableReceivableRow;
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

  const methods = useForm<EditReceivablesFormField>({
    defaultValues: {
      paid_amount: row.paid_amount,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: EditReceivablesFormField) => {
    onSave(row.id, data.paid_amount);
    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        id="edit-receivables-by-invoice-form"
      >
        <div>
          <InputField name="paid_amount" label="Lunas Nota" type="number" />
        </div>
      </form>
    </FormProvider>
  );
}
