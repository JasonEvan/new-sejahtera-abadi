export type PurchaseReturnLineApiItem = {
  id: number;
  stock_id: number;
  name: string;
  price: number;
  qty: number;
};

export type PurchaseReturnLineData = {
  lines: PurchaseReturnLineApiItem[];
  meta: {
    invoice_value: number;
    discount: number;
    total: number;
  };
};

export type PurchaseReturnTableRow = {
  id: number;
  stock_id: number;
  name: string;
  price: number;
  original_qty: number;
  qty: number;
  return_qty: number;
  subtotal: number;
};

export type InsertPurchaseReturn = {
  client_id: number;
  purchase_order_id: number;
  return_date: string;
  lines: {
    purchase_order_line_id: number;
    return_qty: number;
  }[];
};

export type UpdatePurchaseReturn = {
  invoice_number: string;
  return_date: string;
  lines: {
    purchase_order_line_id: number;
    return_qty: number;
  }[];
};

export type EditPurchaseReturnInvoiceOption = {
  id: number;
  invoice_number: string;
};

export type EditPurchaseReturnDetail = {
  transaction_information: {
    purchase_return_id: number;
    purchase_order_id: number;
    client: number;
    invoice_number: string;
    return_date: string;
  };
  lines: PurchaseReturnTableRow[];
  meta: {
    invoice_value: number;
    discount: number;
    total: number;
  };
};
