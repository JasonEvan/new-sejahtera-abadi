"use client";

import { useSaleReturnStore } from "@/stores/transactions/useSaleReturnStore";
import TransactionInformation from "./TransactionInformation";
import ReturnSalesTableData from "./ReturnSalesTableData";
import SalesMetadata from "./SalesMetadata";

export default function SaleReturnContent() {
  const transactionInfo = useSaleReturnStore(
    (state) => state.transaction_information,
  );
  const isVisible = !!transactionInfo.sales_order_id;

  return (
    <div className="mt-5">
      <TransactionInformation />
      {isVisible && (
        <>
          <ReturnSalesTableData />
          <SalesMetadata />
        </>
      )}
    </div>
  );
}
