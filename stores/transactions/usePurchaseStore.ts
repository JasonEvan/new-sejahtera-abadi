import { PurchaseTableRow } from "@/modules/purchase/purchase.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PurchaseStore {
  invoice_information: {
    client: number;
    invoice_date: string | null;
    invoice_number: string;
  };
  setInvoiceInformation: (data: PurchaseStore["invoice_information"]) => void;

  cart: PurchaseTableRow[];
  addToCart: (data: PurchaseTableRow) => void;
  removeFromCart: (id: string) => void;
  updateCart: (id: string, data: PurchaseTableRow) => void;

  meta: {
    invoice_value: number;
    discount: number;
    total: number;
  };
  setMeta: (data: PurchaseStore["meta"]) => void;

  clear: () => void;
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    (set) => ({
      invoice_information: {
        client: 0,
        invoice_date: null,
        invoice_number: "",
      },
      setInvoiceInformation: (data) => set({ invoice_information: data }),

      cart: [],
      addToCart: (data) => {
        set((state) => ({ cart: [...state.cart, data] }));
      },
      removeFromCart: (id) => {
        set((state) => ({ cart: state.cart.filter((item) => item.id !== id) }));
      },
      updateCart: (id, data) => {
        set((state) => ({
          cart: state.cart.map((item) => (item.id === id ? data : item)),
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
          invoice_information: {
            client: 0,
            invoice_date: null,
            invoice_number: "",
          },
          cart: [],
          meta: {
            invoice_value: 0,
            discount: 0,
            total: 0,
          },
        });
      },
    }),
    { name: "purchase-store" },
  ),
);
