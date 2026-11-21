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
import {
  initialPaymentDraftState,
  paymentDraftReducer,
  type EditablePaymentDraftRow,
  type PaymentDraftRow,
} from "@/modules/payment-draft/payment-draft";
import { useGetOrdersMenu } from "@/modules/sale/sale.queries";
import { useUpdateEditReceivablesMutation } from "@/modules/sales-payment/sales-payment.mutations";
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
import EditReceivablesForm from "./EditReceivablesForm";

interface PaymentSearchForm {
  client: number;
  transaction_id: number;
}

interface AddReceivableInvoiceFormProps {
  clientId: number;
  tableRows: EditablePaymentDraftRow[];
  baselineByInvoice: ReadonlyMap<string, number>;
  onAdd: (newRow: PaymentDraftRow, invoiceBalance: number) => void;
}

interface AddInvoiceFormField {
  sales_order_id: number;
  balance_due: number;
  paid_amount: number;
}

// ponytail: Add form matching ReceivablesTable form for adding invoice payment
function AddReceivableInvoiceForm({
  clientId,
  baselineByInvoice,
  tableRows,
  onAdd,
}: AddReceivableInvoiceFormProps) {
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
          sales_order_id: z.number().min(1, "Pilih nota terlebih dahulu"),
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
            (item) => item.id === data.sales_order_id,
          );

          if (
            selectedInvoice &&
            tableRows.some((row) => row.invoice_number === selectedInvoice.name)
          ) {
            ctx.addIssue({
              code: "custom",
              message: "Nomor nota sudah ada di tabel",
              path: ["sales_order_id"],
            });
          }
        }),
    [invoices, tableRows],
  );

  const methods = useForm<AddInvoiceFormField>({
    defaultValues: {
      sales_order_id: 0,
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
    name: "sales_order_id",
  });

  useEffect(() => {
    if (watchedOrderId) {
      const selectedInvoice = invoices?.find(
        (item) => item.id === watchedOrderId,
      );

      if (selectedInvoice) {
        setValue(
          "balance_due",
          baselineByInvoice.get(selectedInvoice.name) ??
            selectedInvoice.balance_due,
        );
      }
    }
  }, [watchedOrderId, invoices, baselineByInvoice, setValue]);

  useEffect(() => {
    if (isError) {
      toast.error(error?.message || "Failed to fetch invoices", {
        position: "bottom-right",
      });
    }
  }, [isError, error]);

  const onSubmit = (formData: AddInvoiceFormField) => {
    const selectedInvoice = invoices?.find(
      (item) => item.id === formData.sales_order_id,
    );

    if (!selectedInvoice) return;

    const newRow: PaymentDraftRow = {
      id: crypto.randomUUID(),
      payment_date: dayjs().format("YYYY-MM-DD"),
      invoice_number: selectedInvoice.name,
      invoice_value: selectedInvoice.invoice_value,
      paid_amount: formData.paid_amount,
    };

    onAdd(newRow, selectedInvoice.balance_due);
    setFocus("sales_order_id");
    reset();
  };

  const handlePayFull = () => {
    const balanceDue = methods.getValues("balance_due");
    const salesOrderId = methods.getValues("sales_order_id");

    if (!salesOrderId) {
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
            name="sales_order_id"
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

export default function EditReceivablesTable() {
  const updateMutation = useUpdateEditReceivablesMutation();
  const [searchTransactionNumber, setSearchTransactionNumber] = useState("");
  const [tableState, dispatch] = useReducer(
    paymentDraftReducer,
    initialPaymentDraftState,
  );

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

    if (selectedTrx.name === tableState.activeInvoiceNumber) {
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

    const mappedRows = data.payments.map((payment) => {
      const formattedDate =
        typeof payment.payment_date === "string"
          ? payment.payment_date.split("T")[0]
          : dayjs(payment.payment_date).format("YYYY-MM-DD");

      return {
        id: payment.id.toString(),
        payment_date: formattedDate,
        invoice_number: payment.invoice_number,
        invoice_value: payment.invoice_value,
        paid_amount: payment.paid_amount,
        balance_due: payment.balance_due,
      };
    });

    dispatch({
      type: "SET_DATA",
      transactionNumber: data.transaction_number,
      payments: mappedRows,
    });
  }, [
    data,
    isFetching,
    searchTransactionNumber,
    tableState.activeInvoiceNumber,
  ]);

  function handleOpenEditDialog(row: EditablePaymentDraftRow) {
    dialogs.open({
      title: "Edit Pelunasan Piutang",
      description: `${row.invoice_number} - Nilai Nota: ${row.invoice_value.toLocaleString("id-ID")}`,
      type: "form",
      formId: "edit-receivables-by-invoice-form",
      children: (
        <EditReceivablesForm
          row={row}
          onSave={(id, paidAmount) => {
            dispatch({ type: "EDIT_ROW", id, paidAmount });
          }}
        />
      ),
    });
  }

  function handleDeleteRow(id: string) {
    dispatch({ type: "DELETE_ROW", id });
  }

  function handleAddRow(row: PaymentDraftRow, invoiceBalance: number) {
    dispatch({ type: "ADD_ROW", row, invoiceBalance });
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
    tableState.activeInvoiceNumber !== null && !isSearchStale;

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
          <AddReceivableInvoiceForm
            clientId={watchedClient}
            baselineByInvoice={tableState.baselineByInvoice}
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
              disabled={
                updateMutation.isPending || tableState.tableRows.length === 0
              }
            >
              {updateMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
