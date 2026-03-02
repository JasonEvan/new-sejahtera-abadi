import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useGetClientNames } from "@/modules/client/client.queries";
import { invoiceInformationValidation } from "@/modules/purchase/purchase.validation";
import { usePurchaseStore } from "@/stores/transactions/usePurchaseStore";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

type InvoiceInformationFormField = z.infer<typeof invoiceInformationValidation>;

export default function InvoiceInformation() {
  const { data: clients } = useGetClientNames();
  const invoiceInformation = usePurchaseStore(
    (state) => state.invoice_information,
  );

  const methods = useForm<InvoiceInformationFormField>({
    defaultValues: {
      client: 0,
      invoice_date: dayjs().format("YYYY-MM-DD"),
      invoice_number: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(invoiceInformationValidation),
  });

  const onSubmit = (data: InvoiceInformationFormField) => {
    usePurchaseStore.getState().setInvoiceInformation({
      client: data.client,
      invoice_date: data.invoice_date,
      invoice_number: data.invoice_number,
    });
  };

  const { reset, handleSubmit } = methods;

  const handleReset = () => {
    usePurchaseStore.getState().clear();
    reset({
      client: 0,
      invoice_date: dayjs().format("YYYY-MM-DD"),
      invoice_number: "",
    });
  };

  useEffect(() => {
    if (invoiceInformation.client && invoiceInformation.invoice_date) {
      reset({
        client: invoiceInformation.client,
        invoice_date: dayjs(invoiceInformation.invoice_date).format(
          "YYYY-MM-DD",
        ),
        invoice_number: invoiceInformation.invoice_number,
      });
    }
  }, [invoiceInformation, reset]);

  return (
    <div>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-x-2">
            <ComboboxField
              name="client"
              label="Nama Client"
              placeholder="John Doe"
              items={clients || []}
              disabled={!!invoiceInformation.client}
            />
            <InputField
              name="invoice_number"
              label="Nomor Nota"
              disabled={!!invoiceInformation.invoice_number}
            />
          </div>
          <div className="grid grid-cols-2 gap-x-2">
            <InputField
              name="invoice_date"
              type="date"
              label="Tanggal Nota"
              disabled={!!invoiceInformation.invoice_date}
            />
          </div>
          <div className="flex justify-end gap-x-3">
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
              disabled={!!invoiceInformation.client}
              className="cursor-pointer"
            >
              Next
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
