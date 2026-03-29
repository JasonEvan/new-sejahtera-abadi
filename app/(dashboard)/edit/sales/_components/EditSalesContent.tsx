"use client";

import { useEditSaleStore } from "@/stores/transactions/useEditSaleStore";
import InvoiceInformation from "./InvoiceInformation";
import InvoiceItems from "./InvoiceItems";
import InvoiceMeta from "./InvoiceMeta";

export default function EditSalesContent() {
  const invoiceInformation = useEditSaleStore(
    (state) => state.invoice_information,
  );
  const isVisible = !!invoiceInformation.sales_order_id;

  return (
    <div className="mt-5">
      <InvoiceInformation />
      {isVisible && (
        <>
          <InvoiceItems />
          <InvoiceMeta key={invoiceInformation.sales_order_id} />
        </>
      )}
    </div>
  );
}
