import api from "@/lib/axios";
import {
  EditPurchaseReturnDetail,
  EditPurchaseReturnInvoiceOption,
  UpdatePurchaseReturn,
} from "./purchase-return.types";

export async function getEditPurchaseReturnInvoices() {
  const response = await api.get<{ data: EditPurchaseReturnInvoiceOption[] }>(
    "/returns/purchases?for_menu=true",
  );

  return response.data;
}

export async function getEditPurchaseReturnDetail(returnId: number) {
  const response = await api.get<{ data: EditPurchaseReturnDetail }>(
    `/returns/purchases?return_id=${returnId}`,
  );

  return response.data;
}

export async function getReturnHistory(purchaseOrderId: number) {
  const response = await api.get<{
    data: { id: number; return_date: string }[];
  }>(`/returns/purchases?purchase_order_id=${purchaseOrderId}`);

  return response.data;
}

export async function updatePurchaseReturn(data: UpdatePurchaseReturn) {
  const response = await api.put<{ message: string }>(
    "/returns/purchases",
    data,
  );

  return response.data;
}
