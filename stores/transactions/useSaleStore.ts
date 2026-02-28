import { SaleTableRow } from "@/modules/sale/sale.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SaleStore {
  invoice_information: {
    client: number;
    salesman: number;
    invoice_date: string | null;
    invoice_number: string;
  };
  setInvoiceInformation: (data: SaleStore["invoice_information"]) => void;

  cart: SaleTableRow[];
  addToCart: (data: SaleTableRow) => void;
  removeFromCart: (id: string) => void;
  updateCart: (id: string, data: SaleTableRow) => void;

  meta: {
    invoice_value: number;
    discount: number;
    total: number;
  };
  setMeta: (data: SaleStore["meta"]) => void;

  clear: () => void;
}

export const useSaleStore = create<SaleStore>()(
  persist(
    (set) => ({
      invoice_information: {
        client: 0,
        salesman: 0,
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
            salesman: 0,
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
    { name: "sale-store" },
  ),
);
