import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useGetClientNames } from "@/modules/client/client.queries";
import { transactionInformationValidation } from "@/modules/sales-payment/sales-payment.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

// TransactionInformationValidation is same accross payable and receivable payments
type TransactionInformationFormField = z.infer<
  typeof transactionInformationValidation
>;

type TransactionInformationProps = {
  onReset: () => void;
  onSave: (data: TransactionInformationFormField) => void;
  isDisabled: boolean;
};

export default function TransactionInformation({
  onReset,
  onSave,
  isDisabled,
}: TransactionInformationProps) {
  const { data: clients } = useGetClientNames();

  const methods = useForm<TransactionInformationFormField>({
    defaultValues: {
      client: 0,
      transaction_number: "",
      transaction_date: dayjs().format("YYYY-MM-DD"),
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(transactionInformationValidation),
  });

  const onSubmit = (data: TransactionInformationFormField) => {
    onSave(data);
  };

  function handleReset() {
    onReset();
    methods.reset({
      client: 0,
      transaction_number: "",
      transaction_date: dayjs().format("YYYY-MM-DD"),
    });
  }

  return (
    <div>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-3 gap-x-2">
            <ComboboxField
              name="client"
              label="Nama Client"
              items={clients || []}
              placeholder="John Doe"
              disabled={isDisabled}
            />
            <InputField
              name="transaction_number"
              label="Nomor Transaksi"
              disabled={isDisabled}
            />
            <InputField
              name="transaction_date"
              label="Tanggal"
              type="date"
              disabled={isDisabled}
            />
          </div>
          <div className="flex justify-end gap-x-2">
            <Button
              variant="secondary"
              type="button"
              onClick={handleReset}
              className="cursor-pointer"
            >
              Reset
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isDisabled}
            >
              Submit
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
