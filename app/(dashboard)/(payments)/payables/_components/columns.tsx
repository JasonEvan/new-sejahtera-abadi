import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { PurchasePaymentTableRow } from "@/modules/purchase-payment/purchase-payment.types";
import { usePurchasePaymentStore } from "@/stores/payments/usePurchasePaymentStore";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import EditPayablesForm from "./EditPayablesForm";

const columnHelper = createColumnHelper<PurchasePaymentTableRow>();

export const useColumns = () => {
  function handleEdit(row: PurchasePaymentTableRow) {
    dialogs.open({
      title: "Edit Pembayaran Utang",
      description: `${row.invoice_number} - ${row.balance_due.toLocaleString("id-ID")}`,
      type: "form",
      formId: "edit-payables-payment-form",
      children: <EditPayablesForm row={row} />,
    });
  }

  function handleDelete(id: string) {
    usePurchasePaymentStore.getState().removeFromCart(id);
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "number",
        header: "No.",
        cell: ({ row }) => row.index + 1,
      }),

      columnHelper.accessor("invoice_number", {
        header: "Nomor Nota",
      }),

      columnHelper.accessor("balance_due", {
        header: () => <div className="text-right">Saldo Nota</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.accessor("paid_amount", {
        header: () => <div className="text-right">Lunas Nota</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex gap-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(row.original)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      }),
    ],
    [],
  );

  return columns;
};
