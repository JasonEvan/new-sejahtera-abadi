import api from "@/lib/axios";
import {
  InsertPurchase,
  PurchaseInvoiceDetailLine,
  PurchaseInvoiceHeader,
  PurchaseInvoiceRow,
  PurchaseOrder,
} from "./purchase.types";
import {
  InsertPurchaseReturn,
  PurchaseReturnLineData,
} from "../purchase-return/purchase-return.types";

export async function createPurchase(data: InsertPurchase) {
  const response = await api.post<{ message: string }>("/purchases", data);
  return response.data;
}

export async function getOrdersMenu(clientId: number, isPaidOff: boolean) {
  const params = {
    client_id: clientId.toString(),
    is_paid_off: isPaidOff ? "true" : "false",
    for_menu: "true",
  };

  const queryParams = new URLSearchParams(params);

  const response = await api.get<{ data: PurchaseOrder[] }>(
    `/purchases?${queryParams.toString()}`,
  );
  return response.data;
}

export async function getPurchaseInvoices(invoicePrefix: string) {
  const response = await api.get<{ data: PurchaseInvoiceRow[] }>(
    `/purchases?invoice_prefix=${encodeURIComponent(invoicePrefix)}`,
  );
  return response.data;
}

export async function getPurchaseInvoiceDetail(invoiceNumber: string) {
  const response = await api.get<{
    data: { header: PurchaseInvoiceHeader; lines: PurchaseInvoiceDetailLine[] };
  }>(`/purchases/detail?invoice_number=${encodeURIComponent(invoiceNumber)}`);
  return response.data;
}

export async function getReturnEligibleOrders(clientId: number) {
  const response = await api.get<{
    data: { id: number; invoice_number: string }[];
  }>(`/purchases?for_return=true&client_id=${clientId}`);
  return response.data;
}

export async function getPurchaseReturnLines(invoiceNumber: string) {
  const response = await api.get<{ data: PurchaseReturnLineData }>(
    `/purchases/return-lines?invoice_number=${encodeURIComponent(invoiceNumber)}`,
  );
  return response.data;
}

export async function createPurchaseReturn(data: InsertPurchaseReturn) {
  const response = await api.post<{ message: string }>(
    "/returns/purchases",
    data,
  );
  return response.data;
}
