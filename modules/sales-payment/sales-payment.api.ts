import api from "@/lib/axios";
import {
  DeleteEditReceivablesByInvoiceInput,
  EditReceivablesInvoiceDetail,
  InsertSalesPayment,
  SalesPaymentTransactionSummary,
  UpdateEditReceivablesByInvoiceInput,
} from "./sales-payment.types";

export async function createSalesPayment(data: InsertSalesPayment) {
  const response = await api.post<{ message: string }>("/sales-payments", data);
  return response.data;
}

export async function getEditReceivablesByInvoice(invoiceNumber: string) {
  const response = await api.get<{ data: EditReceivablesInvoiceDetail | null }>(
    `/sales-payments/detail?invoice_number=${encodeURIComponent(invoiceNumber)}`,
  );

  return response.data;
}

export async function deleteEditReceivablesByInvoice(
  data: DeleteEditReceivablesByInvoiceInput,
) {
  const response = await api.delete<{ message: string }>(
    "/sales-payments/detail",
    { data },
  );

  return response.data;
}

export async function updateEditReceivablesByInvoice(
  data: UpdateEditReceivablesByInvoiceInput,
) {
  const response = await api.put<{ message: string }>(
    "/sales-payments/detail",
    data,
  );

  return response.data;
}

export async function getSalesPaymentTransactions(clientId: number) {
  const response = await api.get<{ data: { id: number; name: string }[] }>(
    `/sales-payments?client_id=${clientId}`,
  );
  return response.data;
}

export async function getSalesPaymentTransactionSummary(
  transactionNumber: string,
) {
  const response = await api.get<{
    data: SalesPaymentTransactionSummary | null;
  }>(
    `/sales-payments?transaction_number=${encodeURIComponent(transactionNumber)}`,
  );
  return response.data;
}

export async function deleteSalesPaymentTransaction(transactionId: number) {
  const response = await api.delete<{ message: string }>(
    `/sales-payments?transaction_id=${transactionId}`,
  );
  return response.data;
}
