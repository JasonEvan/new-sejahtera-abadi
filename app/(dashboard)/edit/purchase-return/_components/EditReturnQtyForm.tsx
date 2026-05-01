import InputField from "@/components/shared/InputField";
import { dialogs } from "@/lib/dialogs";
import { PurchaseReturnTableRow } from "@/modules/purchase-return/purchase-return.types";
import { useEditPurchaseReturnStore } from "@/stores/transactions/useEditPurchaseReturnStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

export default function EditReturnQtyForm({
  data,
}: {
  data: PurchaseReturnTableRow;
}) {
  const maxValidQty = data._max_valid_qty ?? data.qty + data.return_qty;

  const schema = z.object({
    return_qty: z
      .int()
      .min(0, "Jumlah retur tidak boleh negatif")
      .max(
        maxValidQty,
        `Jumlah retur tidak boleh melebihi sisa barang yang tersedia (${maxValidQty})`,
      ),
  });

  const methods = useForm<{ return_qty: number }>({
    defaultValues: { return_qty: data.return_qty },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: { return_qty: number }) => {
    useEditPurchaseReturnStore
      .getState()
      .updateLineReturnQty(data.id, values.return_qty);
    dialogs.close();
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        id="edit-purchase-return-qty-form"
        className="space-y-3"
      >
        <InputField name="return_qty" label="Jumlah Retur" type="number" />
      </form>
    </FormProvider>
  );
}
