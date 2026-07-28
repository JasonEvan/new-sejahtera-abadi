"use client";

import TransactionInformation from "../../_components/TransactionInvormation";
import { usePurchasePaymentStore } from "@/stores/payments/usePurchasePaymentStore";
import PayablesTable from "./PayablesTable";
import { getPurchasePaymentTransactionSummary } from "@/modules/purchase-payment/purchase-payment.api";

export default function PayablesContent() {
  const transaction_information = usePurchasePaymentStore(
    (state) => state.transaction_information,
  );

  const isTransactionInformationFilled =
    !!transaction_information.client &&
    !!transaction_information.transaction_number;

  return (
    <div className="mt-5">
      <TransactionInformation
        onReset={usePurchasePaymentStore.getState().clear}
        onSave={usePurchasePaymentStore.getState().setTransactionInformation}
        isDisabled={isTransactionInformationFilled}
        onCheckTransactionNumber={async (trxNum) => {
          const res = await getPurchasePaymentTransactionSummary(trxNum);
          return !!res.data;
        }}
      />
      {isTransactionInformationFilled && <PayablesTable />}
    </div>
  );
}
