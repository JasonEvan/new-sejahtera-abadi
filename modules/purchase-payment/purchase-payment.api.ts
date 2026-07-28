import api from "@/lib/axios";
import {
  DeleteEditPayablesByInvoiceInput,
  EditPayablesInvoiceDetail,
  InsertPurchasePayment,
  UpdateEditPayablesByInvoiceInput,
} from "./purchase-payment.types";

export async function createPurchasePayment(data: InsertPurchasePayment) {
  const response = await api.post<{ message: string }>(
    "/purchase-payments",
    data,
  );
  return response.data;
}

export async function getEditPayablesByInvoice(invoiceNumber: string) {
  const response = await api.get<{ data: EditPayablesInvoiceDetail | null }>(
    `/purchase-payments/detail?invoice_number=${encodeURIComponent(invoiceNumber)}`,
  );

  return response.data;
}

export async function deleteEditPayablesByInvoice(
  data: DeleteEditPayablesByInvoiceInput,
) {
  const response = await api.delete<{ message: string }>(
    "/purchase-payments/detail",
    { data },
  );

  return response.data;
}

export async function updateEditPayablesByInvoice(
  data: UpdateEditPayablesByInvoiceInput,
) {
  const response = await api.put<{ message: string }>(
    "/purchase-payments/detail",
    data,
  );

  return response.data;
}

export async function getPurchasePaymentTransactions(clientId: number) {
  const response = await api.get<{ data: { id: number; name: string }[] }>(
    `/purchase-payments?client_id=${clientId}`,
  );
  return response.data;
}

export async function getPurchasePaymentTransactionSummary(
  transactionNumber: string,
) {
  const response = await api.get<{
    data: {
      transaction_number: string;
      payment_date: string;
      total_paid: number;
      invoice_count: number;
      payments: {
        id: number;
        paid_amount: number;
        payment_date: string;
        invoice_number: string;
        invoice_value: number;
      }[];
    } | null;
  }>(
    `/purchase-payments?transaction_number=${encodeURIComponent(transactionNumber)}`,
  );
  return response.data;
}

export async function deletePurchasePaymentTransaction(transactionId: number) {
  const response = await api.delete<{ message: string }>(
    `/purchase-payments?transaction_id=${transactionId}`,
  );
  return response.data;
}
