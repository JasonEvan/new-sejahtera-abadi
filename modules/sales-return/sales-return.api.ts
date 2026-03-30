import api from "@/lib/axios";
import {
  EditSaleReturnDetail,
  EditSaleReturnInvoiceOption,
  UpdateSaleReturn,
} from "./sales-return.types";

export async function getEditSaleReturnInvoices() {
  const response = await api.get<{ data: EditSaleReturnInvoiceOption[] }>(
    "/returns/sales?for_menu=true",
  );

  return response.data;
}

export async function getEditSaleReturnDetail(invoiceNumber: string) {
  const response = await api.get<{ data: EditSaleReturnDetail }>(
    `/returns/sales?invoice_number=${encodeURIComponent(invoiceNumber)}`,
  );

  return response.data;
}

export async function updateSaleReturn(data: UpdateSaleReturn) {
  const response = await api.put<{ message: string }>("/returns/sales", data);

  return response.data;
}
