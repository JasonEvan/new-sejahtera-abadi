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
