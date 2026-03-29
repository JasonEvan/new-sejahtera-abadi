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
