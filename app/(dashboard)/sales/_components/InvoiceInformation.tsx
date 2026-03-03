import { invoiceInformationValidation } from "@/modules/sale/sale.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";
import dayjs from "dayjs";
import ComboboxField from "@/components/shared/ComboboxField";
import { useGetClientNames } from "@/modules/client/client.queries";
import { useGetSalespersonNames } from "@/modules/salesperson/salesperson.queries";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useSaleStore } from "@/stores/transactions/useSaleStore";
import { useEffect } from "react";

type InvoiceInformationFormField = z.infer<typeof invoiceInformationValidation>;

export default function InvoiceInformation() {
  const { data: clients } = useGetClientNames();
  const { data: salespersons } = useGetSalespersonNames();
  const invoiceInformation = useSaleStore((state) => state.invoice_information);

  const methods = useForm<InvoiceInformationFormField>({
    defaultValues: {
      client: 0,
      salesman: 0,
      invoice_date: dayjs().format("YYYY-MM-DD"),
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(invoiceInformationValidation),
  });

  const onSubmit = (data: InvoiceInformationFormField) => {
    useSaleStore.getState().setInvoiceInformation({
      client: data.client,
      salesman: data.salesman,
      invoice_date: data.invoice_date,
      invoice_number: data.invoice_number,
    });
  };

  const { reset, handleSubmit, setValue, control } = methods;

  const watchedSalesman = useWatch({
    control,
    name: "salesman",
  });

  const handleReset = () => {
    useSaleStore.getState().clear();
    reset({
      client: 0,
      salesman: 0,
      invoice_date: dayjs().format("YYYY-MM-DD"),
      invoice_number: "",
    });
  };

  useEffect(() => {
    if (watchedSalesman) {
      const selectedSalesman = salespersons?.find(
        (salesman) => salesman.id === watchedSalesman,
      );

      if (selectedSalesman) {
        const frontNumber = selectedSalesman.front_number;
        const lastNum = (selectedSalesman.invoice_number + 1)
          .toString()
          .padStart(5, "0");
        setValue("invoice_number", `${frontNumber}${lastNum}`, {
          shouldValidate: true,
        });
      }
    }
  }, [watchedSalesman, setValue, salespersons]);

  useEffect(() => {
    if (invoiceInformation.client && invoiceInformation.invoice_date) {
      reset({
        client: invoiceInformation.client,
        salesman: invoiceInformation.salesman,
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
            <ComboboxField
              name="salesman"
              label="Nama Sales"
              placeholder="Jane Doe"
              items={salespersons || []}
              disabled={!!invoiceInformation.salesman}
            />
          </div>
          <div className="grid grid-cols-2 gap-x-2">
            <InputField
              name="invoice_number"
              label="Nomor Nota"
              disabled={!!invoiceInformation.invoice_number}
            />
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
