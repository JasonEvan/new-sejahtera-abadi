import { SalesPaymentTableRow } from "@/modules/sales-payment/sales-payment.types";
import { create } from "zustand";

interface SalesPaymentStore {
  transaction_information: {
    client: number;
    transaction_number: string;
    transaction_date: string;
  };
  setTransactionInformation: (
    data: SalesPaymentStore["transaction_information"],
  ) => void;

  cart: SalesPaymentTableRow[];
  addToCart: (data: SalesPaymentTableRow) => void;
  removeFromCart: (id: string) => void;
  updateCart: (id: string, data: SalesPaymentTableRow) => void;

  clear: () => void;
}

export const useSalesPaymentStore = create<SalesPaymentStore>((set) => ({
  transaction_information: {
    client: 0,
    transaction_number: "",
    transaction_date: "",
  },
  setTransactionInformation: (data) => set({ transaction_information: data }),

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

  clear: () => {
    set({
      transaction_information: {
        client: 0,
        transaction_number: "",
        transaction_date: "",
      },
      cart: [],
    });
  },
}));
