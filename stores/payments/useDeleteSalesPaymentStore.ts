import { create } from "zustand";

interface DeleteSalesPaymentStore {
  transaction_information: {
    client: number;
    transaction_id: number;
  };
  setTransactionInformation: (
    data: DeleteSalesPaymentStore["transaction_information"],
  ) => void;

  meta: {
    transaction_number: string;
    payment_date: string;
    total_paid: number;
    invoice_count: number;
  };
  setMeta: (meta: DeleteSalesPaymentStore["meta"]) => void;

  clear: () => void;
}

export const useDeleteSalesPaymentStore = create<DeleteSalesPaymentStore>(
  (set) => ({
    transaction_information: {
      client: 0,
      transaction_id: 0,
    },
    setTransactionInformation: (data) => set({ transaction_information: data }),

    meta: {
      transaction_number: "",
      payment_date: "",
      total_paid: 0,
      invoice_count: 0,
    },
    setMeta: (meta) => set({ meta }),

    clear: () => {
      set({
        transaction_information: {
          client: 0,
          transaction_id: 0,
        },
        meta: {
          transaction_number: "",
          payment_date: "",
          total_paid: 0,
          invoice_count: 0,
        },
      });
    },
  }),
);
