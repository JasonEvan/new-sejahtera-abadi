"use client";

import { useEditSaleReturnStore } from "@/stores/transactions/useEditSaleReturnStore";
import InvoiceInformation from "./InvoiceInformation";
import ReturnSalesTableData from "./ReturnSalesTableData";
import SalesMetadata from "./SalesMetadata";

export default function EditSaleReturnContent() {
  const transactionInfo = useEditSaleReturnStore(
    (state) => state.transaction_information,
  );
  const isVisible = !!transactionInfo.sales_order_id;

  return (
    <div className="mt-5">
      <InvoiceInformation />
      {isVisible && (
        <>
          <ReturnSalesTableData />
          <SalesMetadata key={transactionInfo.sales_return_id} />
        </>
      )}
    </div>
  );
}
