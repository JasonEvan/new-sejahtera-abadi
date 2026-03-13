import api from "@/lib/axios";
import {
  InsertSale,
  SalesInvoiceDetailLine,
  SalesInvoiceHeader,
  SalesInvoiceRow,
  SalesOrder,
} from "./sale.types";
import {
  InsertSaleReturn,
  SaleReturnLineData,
} from "../sales-return/sales-return.types";

export async function createSale(data: InsertSale) {
  const response = await api.post<{ message: string }>("/sales", data);
  return response.data;
}

export async function getOrdersMenu(clientId: number, isPaidOff: boolean) {
  const params = {
    client_id: clientId.toString(),
    is_paid_off: isPaidOff ? "true" : "false",
    for_menu: "true",
  };

  const queryParams = new URLSearchParams(params);

  const response = await api.get<{ data: SalesOrder[] }>(
    `/sales?${queryParams.toString()}`,
  );
  return response.data;
}

export async function getSalesInvoices(invoicePrefix: string) {
  const response = await api.get<{ data: SalesInvoiceRow[] }>(
    `/sales?invoice_prefix=${encodeURIComponent(invoicePrefix)}`,
  );
  return response.data;
}

export async function getSalesInvoiceDetail(invoiceNumber: string) {
  const response = await api.get<{
    data: { header: SalesInvoiceHeader; lines: SalesInvoiceDetailLine[] };
  }>(`/sales/detail?invoice_number=${encodeURIComponent(invoiceNumber)}`);
  return response.data;
}

export async function getReturnEligibleOrders(clientId: number) {
  const response = await api.get<{
    data: { id: number; invoice_number: string }[];
  }>(`/sales?for_return=true&client_id=${clientId}`);
  return response.data;
}

export async function getSaleReturnLines(invoiceNumber: string) {
  const response = await api.get<{ data: SaleReturnLineData }>(
    `/sales/return-lines?invoice_number=${encodeURIComponent(invoiceNumber)}`,
  );
  return response.data;
}

export async function createSaleReturn(data: InsertSaleReturn) {
  const response = await api.post<{ message: string }>("/returns/sales", data);
  return response.data;
}
