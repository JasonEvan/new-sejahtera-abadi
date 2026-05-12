import { create } from "zustand";

interface DeletePurchaseReturnStore {
  transaction_information: {
    client: number;
    purchase_order_id: number;
    purchase_return_id: number;
    invoice_number: string;
    return_date: string;
  };
  setTransactionInformation: (
    data: DeletePurchaseReturnStore["transaction_information"],
  ) => void;

  clear: () => void;
}

export const useDeletePurchaseReturnStore = create<DeletePurchaseReturnStore>(
  (set) => ({
    transaction_information: {
      client: 0,
      purchase_order_id: 0,
      purchase_return_id: 0,
      invoice_number: "",
      return_date: "",
    },
    setTransactionInformation: (data) => set({ transaction_information: data }),

    clear: () => {
      set({
        transaction_information: {
          client: 0,
          purchase_order_id: 0,
          purchase_return_id: 0,
          invoice_number: "",
          return_date: "",
        },
      });
    },
  }),
);
