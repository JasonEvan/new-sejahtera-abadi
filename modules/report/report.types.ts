export interface InventoryLedgerTableRow {
  invoice_number: string | null;
  invoice_date: string | null;
  name: string | null;
  city: string | null;
  type: "B" | "J" | "BR" | "JR" | null;
  price: number | null;
  qty_in: number | null;
  qty_out: number | null;
  final_qty: number;
}

export interface AllPayablesTableRow {
  name: string;
  city: string;
  invoice_number: string;
  invoice_date: string | null;
  invoice_value: number;
  paid_amount: number;
  payment_date: string | null;
  balance_due: number;
}
