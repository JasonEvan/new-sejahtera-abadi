"use client";

import InputField from "@/components/shared/InputField";
import { DataTable } from "@/components/shared/DataTable";
import { Spinner } from "@/components/ui/spinner";
import { useGetSalesInvoices } from "@/modules/sale/sale.queries";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { columns } from "./columns";

export default function SalesInvoiceContent() {
  const methods = useForm<{ invoice_number: string }>({
    defaultValues: { invoice_number: "" },
  });

  const invoiceNumber = useWatch({
    control: methods.control,
    name: "invoice_number",
  });

  const { data: invoices, isLoading } = useGetSalesInvoices(
    invoiceNumber,
    !!invoiceNumber,
  );

  return (
    <div className="flex flex-col gap-y-3 mt-3">
      <FormProvider {...methods}>
        <form className="w-1/3" onSubmit={(e) => e.preventDefault()}>
          <InputField
            name="invoice_number"
            label="Nomor Nota"
            placeholder="Cari nomor nota..."
          />
        </form>
      </FormProvider>
      {isLoading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable data={invoices || []} columns={columns} maxHeight="600px" />
      )}
    </div>
  );
}
