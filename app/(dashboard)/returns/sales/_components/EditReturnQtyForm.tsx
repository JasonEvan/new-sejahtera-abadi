import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import { SaleReturnTableRow } from "@/modules/sales-return/sales-return.types";
import { useSaleReturnStore } from "@/stores/transactions/useSaleReturnStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

export default function EditReturnQtyForm({
  data,
}: {
  data: SaleReturnTableRow;
}) {
  const schema = z.object({
    return_qty: z
      .int()
      .min(0, "Jumlah retur tidak boleh negatif")
      .max(
        data.original_qty,
        `Jumlah retur tidak boleh melebihi jumlah asli (${data.original_qty})`,
      ),
  });

  const methods = useForm<{ return_qty: number }>({
    defaultValues: { return_qty: data.return_qty },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: { return_qty: number }) => {
    useSaleReturnStore
      .getState()
      .updateLineReturnQty(data.id, values.return_qty);
    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        id="edit-return-qty-form"
        className="space-y-3"
      >
        <InputField name="return_qty" label="Jumlah Retur" type="number" />
      </form>
    </FormProvider>
  );
}
