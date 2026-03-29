"use client";

import { usePurchaseReturnStore } from "@/stores/transactions/usePurchaseReturnStore";
import TransactionInformation from "./TransactionInformation";
import ReturnPurchasesTableData from "./ReturnPurchasesTableData";
import PurchasesMetadata from "./PurchasesMetadata";

export default function PurchaseReturnContent() {
  const transactionInfo = usePurchaseReturnStore(
    (state) => state.transaction_information,
  );
  const isVisible = !!transactionInfo.purchase_order_id;

  return (
    <div className="mt-5">
      <TransactionInformation />
      {isVisible && (
        <>
          <ReturnPurchasesTableData />
          <PurchasesMetadata />
        </>
      )}
    </div>
  );
}
