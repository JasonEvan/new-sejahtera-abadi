"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import InputField from "@/components/shared/InputField";
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
import { dialogs } from "@/lib/dialogs";
import { useGetClientNames } from "@/modules/client/client.queries";
import { useGetOrdersMenu } from "@/modules/purchase/purchase.queries";
import { useUpdateEditPayablesMutation } from "@/modules/purchase-payment/purchase-payment.mutations";
import {
  useGetPurchasePaymentTransactions,
  useGetPurchasePaymentTransactionSummary,
} from "@/modules/purchase-payment/purchase-payment.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import EditPayablesForm, { EditablePayableRow } from "./EditPayablesForm";

interface PaymentSearchForm {
  client: number;
  transaction_id: number;
}

type TableState = {
  selectedInvoiceValue: number | null;
  tableRows: EditablePayableRow[];
  activeInvoiceNumber: string | null;
  invoiceMaxAllowedMap: Record<string, number>;
};

const initialTableState: TableState = {
  selectedInvoiceValue: null,
  tableRows: [],
  activeInvoiceNumber: null,
  invoiceMaxAllowedMap: {},
};

type TableAction =
  | {
      type: "SET_DATA";
      payload: {
        selectedInvoiceValue: number;
        tableRows: EditablePayableRow[];
        activeInvoiceNumber: string;
        invoiceMaxAllowedMap: Record<string, number>;
      };
    }
  | { type: "RESET" }
  | { type: "UPDATE_ROWS"; payload: { tableRows: EditablePayableRow[] } };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case "SET_DATA":
      return {
        selectedInvoiceValue: action.payload.selectedInvoiceValue,
        tableRows: action.payload.tableRows,
        activeInvoiceNumber: action.payload.activeInvoiceNumber,
        invoiceMaxAllowedMap: action.payload.invoiceMaxAllowedMap,
      };
    case "RESET":
      return initialTableState;
    case "UPDATE_ROWS":
      const invoicePaidMap: Record<string, number> = {};
      action.payload.tableRows.forEach((row) => {
        invoicePaidMap[row.invoice_number] =
          (invoicePaidMap[row.invoice_number] || 0) + row.paid_amount;
      });

      const updatedRows = action.payload.tableRows.map(
        (row: EditablePayableRow) => {
          const maxAllowed =
            state.invoiceMaxAllowedMap[row.invoice_number] ??
            row.balance_due + row.paid_amount;
          const paidForInvoice = invoicePaidMap[row.invoice_number] || 0;

          return {
            ...row,
            balance_due: Math.max(maxAllowed - paidForInvoice, 0),
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

interface AddPayableInvoiceFormProps {
  clientId: number;
  activeTransactionNumber: string;
  tableRows: EditablePayableRow[];
  onAdd: (newRow: EditablePayableRow) => void;
}

interface AddInvoiceFormField {
  purchase_order_id: number;
  balance_due: number;
  paid_amount: number;
}

// ponytail: Add form matching PayablesTable form for adding invoice payment
function AddPayableInvoiceForm({
  clientId,
  activeTransactionNumber,
  tableRows,
  onAdd,
}: AddPayableInvoiceFormProps) {
  const {
    data: invoices,
    isError,
    error,
  } = useGetOrdersMenu({
    clientId,
    isPaidOff: false,
  });

  const schema = useMemo(
    () =>
      z
        .object({
          purchase_order_id: z.number().min(1, "Pilih nota terlebih dahulu"),
          balance_due: z.number().min(0, "Saldo nota tidak valid"),
          paid_amount: z.number().min(1, "Lunas nota minimal 1"),
        })
        .superRefine((data, ctx) => {
          if (data.paid_amount > data.balance_due) {
            ctx.addIssue({
              code: "custom",
              message: "Pelunasan tidak boleh melebihi saldo",
              path: ["paid_amount"],
            });
          }

          const selectedInvoice = invoices?.find(
            (item) => item.id === data.purchase_order_id,
          );

          if (
            selectedInvoice &&
            tableRows.some((row) => row.invoice_number === selectedInvoice.name)
          ) {
            ctx.addIssue({
              code: "custom",
              message: "Nomor nota sudah ada di tabel",
              path: ["purchase_order_id"],
            });
          }
        }),
    [invoices, tableRows],
  );

  const methods = useForm<AddInvoiceFormField>({
    defaultValues: {
      purchase_order_id: 0,
      balance_due: undefined,
      paid_amount: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const { setValue, handleSubmit, reset, setFocus, control } = methods;

  const watchedOrderId = useWatch({
    control,
    name: "purchase_order_id",
  });

  useEffect(() => {
    if (watchedOrderId) {
      const selectedInvoice = invoices?.find(
        (item) => item.id === watchedOrderId,
      );

      if (selectedInvoice) {
        setValue("balance_due", selectedInvoice.balance_due);
      }
    }
  }, [watchedOrderId, invoices, setValue]);

  useEffect(() => {
    if (isError) {
      toast.error(error?.message || "Failed to fetch invoices", {
        position: "bottom-right",
      });
    }
  }, [isError, error]);

  const onSubmit = (formData: AddInvoiceFormField) => {
    const selectedInvoice = invoices?.find(
      (item) => item.id === formData.purchase_order_id,
    );

    if (!selectedInvoice) return;

    const newRow: EditablePayableRow = {
      id: crypto.randomUUID(),
      transaction_number: activeTransactionNumber,
      payment_date: dayjs().format("YYYY-MM-DD"),
      invoice_number: selectedInvoice.name,
      invoice_value: selectedInvoice.invoice_value,
      paid_amount: formData.paid_amount,
      balance_due: Math.max(
        selectedInvoice.invoice_value - formData.paid_amount,
        0,
      ),
    };

    onAdd(newRow);
    setFocus("purchase_order_id");
    reset();
  };

  const handlePayFull = () => {
    const balanceDue = methods.getValues("balance_due");
    const purchaseOrderId = methods.getValues("purchase_order_id");

    if (!purchaseOrderId) {
      toast.error("Pilih nota terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }

    if (balanceDue === undefined || balanceDue === null) {
      toast.error("Saldo nota tidak ditemukan", {
        position: "bottom-right",
      });
      return;
    }

    setValue("paid_amount", balanceDue, { shouldValidate: true });
    handleSubmit(onSubmit)();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-3 gap-x-2">
          <ComboboxField
            name="purchase_order_id"
            label="Nomor Nota"
            items={invoices || []}
          />
          <InputField
            name="balance_due"
            label="Saldo Nota"
            type="number"
            disabled
          />
          <InputField name="paid_amount" label="Lunas Nota" type="number" />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={handlePayFull}
          >
            Add Full Payment
          </Button>
          <Button type="submit" className="cursor-pointer">
            Add
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

export default function EditPayablesTable() {
  const updateMutation = useUpdateEditPayablesMutation();
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

  const { data: transactions } = useGetPurchasePaymentTransactions(
    watchedClient,
    !!watchedClient,
  );

  const { data, isFetching, isError, error } =
    useGetPurchasePaymentTransactionSummary(
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
    if (tableState.activeInvoiceNumber === searchTransactionNumber) return;

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

    const invoicePaidMap: Record<string, number> = {};
    const invoiceMaxAllowedMap: Record<string, number> = {};

    data.payments.forEach((payment) => {
      invoiceMaxAllowedMap[payment.invoice_number] =
        (invoiceMaxAllowedMap[payment.invoice_number] || 0) +
        payment.balance_due +
        payment.paid_amount;
    });

    const mappedRows: EditablePayableRow[] = data.payments.map((payment) => {
      invoicePaidMap[payment.invoice_number] =
        (invoicePaidMap[payment.invoice_number] || 0) + payment.paid_amount;
      const formattedDate =
        typeof payment.payment_date === "string"
          ? payment.payment_date.split("T")[0]
          : dayjs(payment.payment_date).format("YYYY-MM-DD");

      const maxAllowed = invoiceMaxAllowedMap[payment.invoice_number];

      return {
        id: payment.id.toString(),
        transaction_number: data.transaction_number,
        payment_date: formattedDate,
        invoice_number: payment.invoice_number,
        invoice_value: payment.invoice_value,
        paid_amount: payment.paid_amount,
        balance_due: Math.max(
          maxAllowed - invoicePaidMap[payment.invoice_number],
          0,
        ),
      };
    });

    dispatch({
      type: "SET_DATA",
      payload: {
        selectedInvoiceValue: data.total_paid,
        tableRows: mappedRows,
        activeInvoiceNumber: data.transaction_number,
        invoiceMaxAllowedMap,
      },
    });
  }, [
    data,
    isFetching,
    searchTransactionNumber,
    tableState.activeInvoiceNumber,
  ]);

  function handleOpenEditDialog(row: EditablePayableRow) {
    if (tableState.selectedInvoiceValue === null) return;

    dialogs.open({
      title: "Edit Pembayaran Utang",
      description: `${row.invoice_number} - Nilai Nota: ${row.invoice_value.toLocaleString("id-ID")}`,
      type: "form",
      formId: "edit-payables-by-invoice-form",
      children: (
        <EditPayablesForm
          row={row}
          onSave={(id, paidAmount) => {
            const editedRows = tableState.tableRows.map((item) =>
              item.id === id
                ? {
                    ...item,
                    paid_amount: paidAmount,
                  }
                : item,
            );

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

  function handleAddRow(newRow: EditablePayableRow) {
    dispatch({
      type: "UPDATE_ROWS",
      payload: { tableRows: [...tableState.tableRows, newRow] },
    });
  }

  async function handleSubmitChanges() {
    if (!tableState.activeInvoiceNumber) return;

    await updateMutation.mutateAsync({
      transaction_number: tableState.activeInvoiceNumber,
      payments: tableState.tableRows.map((row) => ({
        invoice_number: row.invoice_number,
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

  const isCompleted =
    tableState.selectedInvoiceValue !== null &&
    !isSearchStale &&
    tableState.tableRows.length > 0;

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
          Nomor transaksi berubah. Klik Cari Transaksi untuk memuat ulang data
          terbaru.
        </div>
      )}

      {isCompleted && (
        <div className="space-y-5">
          <AddPayableInvoiceForm
            clientId={watchedClient}
            activeTransactionNumber={tableState.activeInvoiceNumber!}
            tableRows={tableState.tableRows}
            onAdd={handleAddRow}
          />

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Lunas</TableHead>
                  <TableHead>Nomor Nota</TableHead>
                  <TableHead className="text-right">Nilai Nota</TableHead>
                  <TableHead className="text-right">Lunas Nota</TableHead>
                  <TableHead className="text-right">Saldo Nota</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableState.tableRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.payment_date
                        ? dayjs(row.payment_date).format("DD/MM/YYYY")
                        : "-"}
                    </TableCell>
                    <TableCell>{row.invoice_number}</TableCell>
                    <TableCell className="text-right">
                      {row.invoice_value.toLocaleString("id-ID")}
                    </TableCell>
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
                  <TableCell colSpan={3}>Total Amount</TableCell>
                  <TableCell className="text-right">
                    {paidAmountTotal.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleSubmitChanges}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
