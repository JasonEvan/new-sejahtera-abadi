import api from "@/lib/axios";
import {
  DeleteEditPayablesByInvoiceInput,
  EditPayablesPaymentInput,
  EditPayablesInvoiceDetail,
  InsertPurchasePayment,
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

export async function updateEditPayablesByInvoice(data: {
  invoice_number: string;
  payments: EditPayablesPaymentInput[];
}) {
  const response = await api.put<{ message: string }>(
    "/purchase-payments/detail",
    data,
  );

  return response.data;
}
