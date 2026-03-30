"use client";

import { useEditPurchaseReturnStore } from "@/stores/transactions/useEditPurchaseReturnStore";
import InvoiceInformation from "./InvoiceInformation";
import PurchasesMetadata from "./PurchasesMetadata";
import ReturnPurchasesTableData from "./ReturnPurchasesTableData";

export default function EditPurchaseReturnContent() {
  const transactionInfo = useEditPurchaseReturnStore(
    (state) => state.transaction_information,
  );
  const isVisible = !!transactionInfo.purchase_order_id;

  return (
    <div className="mt-5">
      <InvoiceInformation />
      {isVisible && (
        <>
          <ReturnPurchasesTableData />
          <PurchasesMetadata key={transactionInfo.purchase_return_id} />
        </>
      )}
    </div>
  );
}
