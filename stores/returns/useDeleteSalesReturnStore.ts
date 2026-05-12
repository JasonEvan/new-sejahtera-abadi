import { create } from "zustand";

interface DeleteSalesReturnStore {
  transaction_information: {
    client: number;
    sales_order_id: number;
    sales_return_id: number;
    invoice_number: string;
    return_date: string;
  };
  setTransactionInformation: (
    data: DeleteSalesReturnStore["transaction_information"],
  ) => void;

  clear: () => void;
}

export const useDeleteSalesReturnStore = create<DeleteSalesReturnStore>(
  (set) => ({
    transaction_information: {
      client: 0,
      sales_order_id: 0,
      sales_return_id: 0,
      invoice_number: "",
      return_date: "",
    },
    setTransactionInformation: (data) => set({ transaction_information: data }),

    clear: () => {
      set({
        transaction_information: {
          client: 0,
          sales_order_id: 0,
          sales_return_id: 0,
          invoice_number: "",
          return_date: "",
        },
      });
    },
  }),
);
