import { SaleReturnTableRow } from "@/modules/sales-return/sales-return.types";
import { create } from "zustand";

interface EditSaleReturnStore {
  transaction_information: {
    sales_return_id: number;
    sales_order_id: number;
    client: number;
    invoice_number: string;
    return_date: string;
  };
  setTransactionInformation: (
    data: EditSaleReturnStore["transaction_information"],
  ) => void;

  lines: SaleReturnTableRow[];
  setLines: (lines: SaleReturnTableRow[]) => void;
  updateLineReturnQty: (id: number, return_qty: number) => void;

  meta: {
    invoice_value: number;
    discount: number;
    total: number;
  };
  setMeta: (data: EditSaleReturnStore["meta"]) => void;

  clear: () => void;
}

export const useEditSaleReturnStore = create<EditSaleReturnStore>((set) => ({
  transaction_information: {
    sales_return_id: 0,
    sales_order_id: 0,
    client: 0,
    invoice_number: "",
    return_date: "",
  },
  setTransactionInformation: (data) => set({ transaction_information: data }),

  lines: [],
  setLines: (lines) => {
    set({
      lines: lines.map((line) => ({
        ...line,
        _max_valid_qty: line.qty + line.return_qty,
      })),
    });
  },
  updateLineReturnQty: (id, return_qty) => {
    set((state) => ({
      lines: state.lines.map((line) => {
        if (line.id !== id) return line;

        const maxValid = line._max_valid_qty ?? line.qty + line.return_qty;
        const qty = maxValid - return_qty;

        return {
          ...line,
          return_qty,
          qty,
          subtotal: line.price * qty,
        };
      }),
    }));
  },

  meta: {
    invoice_value: 0,
    discount: 0,
    total: 0,
  },
  setMeta: (data) => set({ meta: data }),

  clear: () =>
    set({
      transaction_information: {
        sales_return_id: 0,
        sales_order_id: 0,
        client: 0,
        invoice_number: "",
        return_date: "",
      },
      lines: [],
      meta: {
        invoice_value: 0,
        discount: 0,
        total: 0,
      },
    }),
}));
