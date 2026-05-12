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

export async function getEditSaleReturnDetail(returnId: number) {
  const response = await api.get<{ data: EditSaleReturnDetail }>(
    `/returns/sales?return_id=${returnId}`,
  );

  return response.data;
}

export async function getReturnHistory(salesOrderId: number) {
  const response = await api.get<{
    data: { id: number; return_date: string }[];
  }>(`/returns/sales?sales_order_id=${salesOrderId}`);

  return response.data;
}

export async function updateSaleReturn(data: UpdateSaleReturn) {
  const response = await api.put<{ message: string }>("/returns/sales", data);

  return response.data;
}

export async function deleteSalesReturn(returnId: number) {
  const response = await api.delete<{ message: string }>(
    `/returns/sales?return_id=${returnId}`,
  );

  return response.data;
}
