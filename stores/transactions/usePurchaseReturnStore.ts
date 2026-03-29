import {
  PurchaseReturnLineApiItem,
  PurchaseReturnTableRow,
} from "@/modules/purchase-return/purchase-return.types";
import { create } from "zustand";

interface PurchaseReturnStore {
  transaction_information: {
    client: number;
    purchase_order_id: number;
    invoice_number: string;
    return_date: string;
  };
  setTransactionInformation: (
    data: PurchaseReturnStore["transaction_information"],
  ) => void;

  lines: PurchaseReturnTableRow[];
  setLines: (lines: PurchaseReturnLineApiItem[]) => void;
  updateLineReturnQty: (id: number, return_qty: number) => void;

  meta: {
    invoice_value: number;
    discount: number;
    total: number;
  };
  setMeta: (data: PurchaseReturnStore["meta"]) => void;

  clear: () => void;
}

export const usePurchaseReturnStore = create<PurchaseReturnStore>((set) => ({
  transaction_information: {
    client: 0,
    purchase_order_id: 0,
    invoice_number: "",
    return_date: "",
  },
  setTransactionInformation: (data) => set({ transaction_information: data }),

  lines: [],
  setLines: (lines) => {
    set({
      lines: lines.map((l) => ({
        ...l,
        original_qty: l.qty,
        return_qty: 0,
        subtotal: l.price * l.qty,
      })),
    });
  },
  updateLineReturnQty: (id, return_qty) => {
    set((state) => ({
      lines: state.lines.map((l) => {
        if (l.id !== id) return l;
        const remaining_qty = l.original_qty - return_qty;
        return {
          ...l,
          return_qty,
          qty: remaining_qty,
          subtotal: l.price * remaining_qty,
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

  clear: () => {
    set({
      transaction_information: {
        client: 0,
        purchase_order_id: 0,
        invoice_number: "",
        return_date: "",
      },
      lines: [],
      meta: {
        invoice_value: 0,
        discount: 0,
        total: 0,
      },
    });
  },
}));
