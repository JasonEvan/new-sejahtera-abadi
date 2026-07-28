"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { alertDialogs } from "@/lib/alert-dialogs";
import { dialogs } from "@/lib/dialogs";
import { useGetClientNames } from "@/modules/client/client.queries";
import {
  useDeleteEditReceivablesMutation,
  useUpdateEditReceivablesMutation,
} from "@/modules/sales-payment/sales-payment.mutations";
import {
  useGetSalesPaymentTransactions,
  useGetSalesPaymentTransactionSummary,
} from "@/modules/sales-payment/sales-payment.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import EditReceivablesForm, {
  EditableReceivableRow,
} from "./EditReceivablesForm";

interface PaymentSearchForm {
  client: number;
  transaction_id: number;
}

type TableState = {
  selectedInvoiceValue: number | null;
  tableRows: EditableReceivableRow[];
  activeInvoiceNumber: string | null;
};

const initialTableState: TableState = {
  selectedInvoiceValue: null,
  tableRows: [],
  activeInvoiceNumber: null,
};

type TableAction =
  | {
      type: "SET_DATA";
      payload: {
        selectedInvoiceValue: number;
        tableRows: EditableReceivableRow[];
        activeInvoiceNumber: string;
      };
    }
  | { type: "RESET" }
  | { type: "UPDATE_ROWS"; payload: { tableRows: EditableReceivableRow[] } };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case "SET_DATA":
      return {
        selectedInvoiceValue: action.payload.selectedInvoiceValue,
        tableRows: action.payload.tableRows,
        activeInvoiceNumber: action.payload.activeInvoiceNumber,
      };
    case "RESET":
      return initialTableState;
    case "UPDATE_ROWS":
      const updatedRows = action.payload.tableRows.map(
        (row: EditableReceivableRow, index: number) => {
          const runningPaid = action.payload.tableRows
            .slice(0, index + 1)
            .reduce(
              (sum: number, r: EditableReceivableRow) => sum + r.paid_amount,
              0,
            );
          return {
            ...row,
            balance_due: Math.max(state.selectedInvoiceValue! - runningPaid, 0),
          };
        },
      );
      return {
        ...state,
        tableRows: updatedRows,
      };
    default:
      return state;
  }
}

export default function EditReceivablesTable() {
  const deleteMutation = useDeleteEditReceivablesMutation();
  const updateMutation = useUpdateEditReceivablesMutation();
  const [searchTransactionNumber, setSearchTransactionNumber] = useState("");
  const [tableState, dispatch] = useReducer(tableReducer, initialTableState);

  const { data: clients } = useGetClientNames();

  const schema = useMemo(
    () =>
      z.object({
        client: z.number().min(1, "Pilih client"),
        transaction_id: z.number().min(1, "Pilih nomor transaksi"),
      }),
    [],
  );

  const methods = useForm<PaymentSearchForm>({
    defaultValues: {
      client: 0,
      transaction_id: 0,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const { handleSubmit, control, setValue } = methods;
  const watchedClient = useWatch({ control, name: "client" });
  const watchedTransactionId = useWatch({ control, name: "transaction_id" });

  // ponytail: reset transaction_id when client selection changes
  useEffect(() => {
    setValue("transaction_id", 0);
  }, [watchedClient, setValue]);

  const { data: transactions } = useGetSalesPaymentTransactions(
    watchedClient,
    !!watchedClient,
  );

  const { data, isFetching, isError, error } =
    useGetSalesPaymentTransactionSummary(
      searchTransactionNumber,
      !!searchTransactionNumber,
    );

  const isSearchStale =
    tableState.activeInvoiceNumber !== null &&
    searchTransactionNumber !== tableState.activeInvoiceNumber;

  function handleSearchPayment(formData: PaymentSearchForm) {
    const selectedTrx = transactions?.find(
      (item) => item.id === formData.transaction_id,
    );

    if (!selectedTrx) {
      toast.error("Transaksi tidak ditemukan", { position: "bottom-right" });
      return;
    }

    if (
      selectedTrx.name === tableState.activeInvoiceNumber &&
      tableState.selectedInvoiceValue !== null
    ) {
      toast.info("Transaksi ini sudah dimuat", { position: "bottom-right" });
      return;
    }

    setSearchTransactionNumber(selectedTrx.name);
  }

  useEffect(() => {
    if (isError) {
      toast.error(error?.message || "Gagal memuat data transaksi", {
        position: "bottom-right",
      });
    }
  }, [isError, error]);

  useEffect(() => {
    if (!searchTransactionNumber || isFetching) return;

    if (!data) {
      dispatch({ type: "RESET" });
      toast.error("Data transaksi tidak ditemukan", {
        position: "bottom-right",
      });
      return;
    }

    if (data.payments.length === 0) {
      dispatch({ type: "RESET" });
      toast.error("Transaksi ini tidak memiliki rincian pembayaran", {
        position: "bottom-right",
      });
      return;
    }

    let runningPaidAmount = 0;

    const mappedRows: EditableReceivableRow[] = data.payments.map((payment) => {
      runningPaidAmount += payment.paid_amount;
      const formattedDate =
        typeof payment.payment_date === "string"
          ? payment.payment_date.split("T")[0]
          : dayjs(payment.payment_date).format("YYYY-MM-DD");

      return {
        id: payment.id.toString(),
        transaction_number: data.transaction_number,
        payment_date: formattedDate,
        invoice_number: payment.invoice_number,
        paid_amount: payment.paid_amount,
        balance_due: Math.max(data.total_paid - runningPaidAmount, 0),
      };
    });

    dispatch({
      type: "SET_DATA",
      payload: {
        selectedInvoiceValue: data.total_paid,
        tableRows: mappedRows,
        activeInvoiceNumber: data.transaction_number,
      },
    });
  }, [data, isFetching, searchTransactionNumber]);

  function handleOpenEditDialog(row: EditableReceivableRow) {
    if (tableState.selectedInvoiceValue === null) return;

    dialogs.open({
      title: "Edit Pelunasan Piutang",
      description: `${row.invoice_number} - ${tableState.selectedInvoiceValue.toLocaleString("id-ID")}`,
      type: "form",
      formId: "edit-receivables-by-invoice-form",
      children: (
        <EditReceivablesForm
          row={row}
          invoiceValue={tableState.selectedInvoiceValue}
          onSave={(id, paidAmount) => {
            const editedRows = tableState.tableRows.map((item) =>
              item.id === id
                ? {
                    ...item,
                    paid_amount: paidAmount,
                  }
                : item,
            );

            const totalPaid = editedRows.reduce(
              (total, item) => total + item.paid_amount,
              0,
            );

            if (totalPaid > tableState.selectedInvoiceValue!) {
              toast.error("Total pelunasan tidak boleh melebihi nilai nota", {
                position: "bottom-right",
              });
              return;
            }

            dispatch({
              type: "UPDATE_ROWS",
              payload: { tableRows: editedRows },
            });
          }}
        />
      ),
    });
  }

  function handleDeleteRow(id: string) {
    const remainingRows = tableState.tableRows.filter((item) => item.id !== id);

    dispatch({ type: "UPDATE_ROWS", payload: { tableRows: remainingRows } });
  }

  function handleDeleteAll() {
    if (!tableState.activeInvoiceNumber) return;

    alertDialogs.open({
      title: "Hapus semua transaksi?",
      description:
        "Semua transaksi pada tabel akan dihapus. Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Delete All",
      onConfirm: async () => {
        await deleteMutation.mutateAsync({
          invoice_number: tableState.activeInvoiceNumber!,
        });
        dispatch({ type: "RESET" });
        setSearchTransactionNumber("");
        setValue("client", 0);
        setValue("transaction_id", 0);
      },
    });
  }

  async function handleSubmitChanges() {
    if (!tableState.activeInvoiceNumber) return;

    await updateMutation.mutateAsync({
      invoice_number: tableState.activeInvoiceNumber,
      payments: tableState.tableRows.map((row) => ({
        transaction_number: row.transaction_number,
        payment_date: row.payment_date,
        paid_amount: row.paid_amount,
      })),
    });

    dispatch({ type: "RESET" });
    setSearchTransactionNumber("");
    setValue("client", 0);
    setValue("transaction_id", 0);
  }

  const paidAmountTotal = useMemo(
    () =>
      tableState.tableRows.reduce((total, row) => total + row.paid_amount, 0),
    [tableState.tableRows],
  );

  const invoiceValue = tableState.selectedInvoiceValue ?? 0;
  const balanceDue = Math.max(invoiceValue - paidAmountTotal, 0);

  return (
    <div className="space-y-5">
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(handleSearchPayment)}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComboboxField
              name="client"
              label="Nama Client"
              placeholder="Pilih client"
              items={clients || []}
            />
            <ComboboxField
              name="transaction_id"
              label="Nomor Transaksi"
              placeholder="Pilih nomor transaksi"
              items={transactions || []}
              disabled={!watchedClient}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isFetching || !watchedTransactionId}
            >
              {isFetching ? "Memuat..." : "Cari Transaksi"}
            </Button>
          </div>
        </form>
      </FormProvider>

      {isSearchStale && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Nomor transaksi berubah. Klik Cari Transaksi untuk memuat ulang data terbaru.
        </div>
      )}

      {tableState.selectedInvoiceValue !== null && !isSearchStale && (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Transaksi</TableHead>
                <TableHead>Tanggal Lunas</TableHead>
                <TableHead>Nomor Nota</TableHead>
                <TableHead className="text-right">Lunas Nota</TableHead>
                <TableHead className="text-right">Saldo Nota</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableState.tableRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center">
                    Belum ada transaksi.
                  </TableCell>
                </TableRow>
              )}

              {tableState.tableRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.transaction_number}</TableCell>
                  <TableCell>{row.payment_date}</TableCell>
                  <TableCell>{row.invoice_number}</TableCell>
                  <TableCell className="text-right">
                    {row.paid_amount.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.balance_due.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleOpenEditDialog(row)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="text-destructive"
                        onClick={() => handleDeleteRow(row.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Invoice Value</TableCell>
                <TableCell colSpan={2} className="text-right">
                  {invoiceValue.toLocaleString("id-ID")}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4}>Paid Amount</TableCell>
                <TableCell colSpan={2} className="text-right">
                  {paidAmountTotal.toLocaleString("id-ID")}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4}>Balance Due</TableCell>
                <TableCell colSpan={2} className="text-right">
                  {balanceDue.toLocaleString("id-ID")}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      <div className="flex justify-end gap-x-2">
        <Button
          variant="destructive"
          type="button"
          className="cursor-pointer"
          onClick={handleDeleteAll}
          disabled={
            tableState.selectedInvoiceValue === null ||
            tableState.tableRows.length === 0 ||
            isSearchStale ||
            deleteMutation.isPending ||
            updateMutation.isPending
          }
        >
          Delete
        </Button>
        <Button
          type="button"
          className="cursor-pointer"
          onClick={handleSubmitChanges}
          disabled={
            tableState.selectedInvoiceValue === null ||
            isSearchStale ||
            tableState.tableRows.length === 0 ||
            deleteMutation.isPending ||
            updateMutation.isPending
          }
        >
          {updateMutation.isPending ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
