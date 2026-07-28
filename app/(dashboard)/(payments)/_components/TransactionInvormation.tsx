import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
import { Button } from "@/components/ui/button";
import { useGetClientNames } from "@/modules/client/client.queries";
import { transactionInformationValidation } from "@/modules/sales-payment/sales-payment.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
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
  onCheckTransactionNumber?: (transactionNumber: string) => Promise<boolean>;
};

export default function TransactionInformation({
  onReset,
  onSave,
  isDisabled,
  onCheckTransactionNumber,
}: TransactionInformationProps) {
  const { data: clients } = useGetClientNames();
  const [isChecking, setIsChecking] = useState(false);

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

  // ponytail: reset react-hook-form values when form is enabled (e.g. after payment success clear)
  useEffect(() => {
    if (!isDisabled) {
      methods.reset({
        client: 0,
        transaction_number: "",
        transaction_date: dayjs().format("YYYY-MM-DD"),
      });
    }
  }, [isDisabled, methods]);

  const onSubmit = async (data: TransactionInformationFormField) => {
    if (onCheckTransactionNumber) {
      setIsChecking(true);
      try {
        // ponytail: check DB for duplicate transaction number before proceeding
        const exists = await onCheckTransactionNumber(data.transaction_number);
        if (exists) {
          methods.setError("transaction_number", {
            type: "manual",
            message: "Nomor transaksi sudah digunakan",
          });
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // ignore error and proceed
      } finally {
        setIsChecking(false);
      }
    }
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
              disabled={isDisabled || isChecking}
            >
              {isChecking ? "Checking..." : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
