"use client";

import { useEditPurchaseStore } from "@/stores/transactions/useEditPurchaseStore";
import InvoiceInformation from "./InvoiceInformation";
import InvoiceItems from "./InvoiceItems";
import InvoiceMeta from "./InvoiceMeta";

export default function EditPurchasesContent() {
  const invoiceInformation = useEditPurchaseStore(
    (state) => state.invoice_information,
  );
  const isVisible = !!invoiceInformation.purchase_order_id;

  return (
    <div className="mt-5">
      <InvoiceInformation />
      {isVisible && (
        <>
          <InvoiceItems />
          <InvoiceMeta key={invoiceInformation.purchase_order_id} />
        </>
      )}
    </div>
  );
}
