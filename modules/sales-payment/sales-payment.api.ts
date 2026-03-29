import api from "@/lib/axios";
import {
  DeleteEditReceivablesByInvoiceInput,
  EditReceivablesInvoiceDetail,
  EditReceivablesPaymentInput,
  InsertSalesPayment,
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

export async function updateEditReceivablesByInvoice(data: {
  invoice_number: string;
  payments: EditReceivablesPaymentInput[];
}) {
  const response = await api.put<{ message: string }>(
    "/sales-payments/detail",
    data,
  );

  return response.data;
}
