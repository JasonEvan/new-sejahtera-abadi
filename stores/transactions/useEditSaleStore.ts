import { SaleReturnLineApiItem } from "@/modules/sales-return/sales-return.types";
import { create } from "zustand";

export type EditSaleItemRow = {
  id: string;
  sales_order_line_id?: number;
  stock_id: number;
  name: string;
  quantity: number;
  capital_cost: number;
  selling_price: number;
  subtotal: number;
};

interface EditSaleStore {
  invoice_information: {
    client: number;
    sales_order_id: number;
    invoice_number: string;
  };
  setInvoiceInformation: (data: EditSaleStore["invoice_information"]) => void;

  items: EditSaleItemRow[];
  setItemsFromInvoice: (lines: SaleReturnLineApiItem[]) => void;
  addItem: (item: Omit<EditSaleItemRow, "id">) => void;
  updateItem: (id: string, item: Omit<EditSaleItemRow, "id">) => void;
  removeItem: (id: string) => void;

  base_quantities_by_stock: Record<number, number>;

  meta: {
    invoice_value: number;
    discount: number;
    total: number;
  };
  setMeta: (meta: EditSaleStore["meta"]) => void;

  clear: () => void;
}

export const useEditSaleStore = create<EditSaleStore>((set) => ({
  invoice_information: {
    client: 0,
    sales_order_id: 0,
    invoice_number: "",
  },
  setInvoiceInformation: (data) => set({ invoice_information: data }),

  items: [],
  setItemsFromInvoice: (lines) => {
    const mappedLines = lines.map((line) => ({
      id: `line-${line.id}`,
      sales_order_line_id: line.id,
      stock_id: line.stock_id,
      name: line.name,
      quantity: line.qty,
      capital_cost: 0,
      selling_price: line.price,
      subtotal: line.price * line.qty,
    }));

    const baseQuantitiesByStock = lines.reduce<Record<number, number>>(
      (acc, curr) => {
        acc[curr.stock_id] = (acc[curr.stock_id] || 0) + curr.qty;
        return acc;
      },
      {},
    );

    set({
      items: mappedLines,
      base_quantities_by_stock: baseQuantitiesByStock,
    });
  },
  addItem: (item) => {
    set((state) => ({
      items: [...state.items, { ...item, id: crypto.randomUUID() }],
    }));
  },
  updateItem: (id, item) => {
    set((state) => ({
      items: state.items.map((curr) =>
        curr.id === id ? { ...item, id } : curr,
      ),
    }));
  },
  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  base_quantities_by_stock: {},

  meta: {
    invoice_value: 0,
    discount: 0,
    total: 0,
  },
  setMeta: (meta) => set({ meta }),

  clear: () => {
    set({
      invoice_information: {
        client: 0,
        sales_order_id: 0,
        invoice_number: "",
      },
      items: [],
      base_quantities_by_stock: {},
      meta: {
        invoice_value: 0,
        discount: 0,
        total: 0,
      },
    });
  },
}));
