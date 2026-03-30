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

export async function getEditPurchaseReturnDetail(invoiceNumber: string) {
  const response = await api.get<{ data: EditPurchaseReturnDetail }>(
    `/returns/purchases?invoice_number=${encodeURIComponent(invoiceNumber)}`,
  );

  return response.data;
}

export async function updatePurchaseReturn(data: UpdatePurchaseReturn) {
  const response = await api.put<{ message: string }>(
    "/returns/purchases",
    data,
  );

  return response.data;
}
