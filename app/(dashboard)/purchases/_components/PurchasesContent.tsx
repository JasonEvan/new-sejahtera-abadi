"use client";

import { usePurchaseStore } from "@/stores/transactions/usePurchaseStore";
import InvoiceInformation from "./InvoiceInformation";
import Cart from "./Cart";
import InvoiceMeta from "./InvoiceMeta";

export default function PurchasesContent() {
  const invoiceInformation = usePurchaseStore(
    (state) => state.invoice_information,
  );
  return (
    <div className="mt-5">
      <InvoiceInformation />
      {!!invoiceInformation.client && !!invoiceInformation.invoice_date && (
        <>
          <Cart />
          <InvoiceMeta />
        </>
      )}
    </div>
  );
}
