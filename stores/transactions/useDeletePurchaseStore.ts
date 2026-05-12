import { create } from "zustand";

interface DeletePurchaseStore {
  invoice_information: {
    client: number;
    purchase_order_id: number;
    invoice_number: string;
  };
  setInvoiceInformation: (
    data: DeletePurchaseStore["invoice_information"],
  ) => void;

  meta: {
    invoice_value: number;
    discount: number;
    total: number;
    product_count: number;
  };
  setMeta: (meta: DeletePurchaseStore["meta"]) => void;

  clear: () => void;
}

export const useDeletePurchaseStore = create<DeletePurchaseStore>((set) => ({
  invoice_information: {
    client: 0,
    purchase_order_id: 0,
    invoice_number: "",
  },
  setInvoiceInformation: (data) => set({ invoice_information: data }),

  meta: {
    invoice_value: 0,
    discount: 0,
    total: 0,
    product_count: 0,
  },
  setMeta: (meta) => set({ meta }),

  clear: () => {
    set({
      invoice_information: {
        client: 0,
        purchase_order_id: 0,
        invoice_number: "",
      },
      meta: {
        invoice_value: 0,
        discount: 0,
        total: 0,
        product_count: 0,
      },
    });
  },
}));
