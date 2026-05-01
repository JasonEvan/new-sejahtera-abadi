export type SaleReturnLineApiItem = {
  id: number;
  stock_id: number;
  name: string;
  price: number;
  qty: number;
};

export type SaleReturnLineData = {
  lines: SaleReturnLineApiItem[];
  meta: {
    invoice_value: number;
    discount: number;
    total: number;
  };
};

export type SaleReturnTableRow = {
  id: number;
  stock_id: number;
  name: string;
  price: number;
  original_qty: number;
  qty: number;
  return_qty: number;
  subtotal: number;
  _max_valid_qty?: number;
};

export type InsertSaleReturn = {
  client_id: number;
  sales_order_id: number;
  return_date: string;
  lines: {
    sales_order_line_id: number;
    return_qty: number;
  }[];
};

export type UpdateSaleReturn = {
  sales_return_id: number;
  return_date: string;
  lines: {
    sales_order_line_id: number;
    return_qty: number;
  }[];
};

export type EditSaleReturnInvoiceOption = {
  id: number;
  invoice_number: string;
};

export type EditSaleReturnDetail = {
  transaction_information: {
    sales_return_id: number;
    sales_order_id: number;
    client: number;
    invoice_number: string;
    return_date: string;
  };
  lines: SaleReturnTableRow[];
  meta: {
    invoice_value: number;
    discount: number;
    total: number;
  };
};
