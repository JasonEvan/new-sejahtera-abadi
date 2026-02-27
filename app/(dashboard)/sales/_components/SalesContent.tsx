"use client";

import { useSaleStore } from "@/stores/transactions/useSaleStore";
import InvoiceInformation from "./InvoiceInformation";
import Cart from "./Cart";
import InvoiceMeta from "./InvoiceMeta";

export default function SalesContent() {
  const invoiceInformation = useSaleStore((state) => state.invoice_information);
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
