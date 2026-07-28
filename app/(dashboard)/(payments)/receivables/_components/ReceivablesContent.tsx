"use client";

import { useSalesPaymentStore } from "@/stores/payments/useSalesPaymentStore";
import TransactionInformation from "../../_components/TransactionInvormation";
import ReceivablesTable from "./ReceivablesTable";
import { getSalesPaymentTransactionSummary } from "@/modules/sales-payment/sales-payment.api";

export default function ReceivablesContent() {
  const transaction_information = useSalesPaymentStore(
    (state) => state.transaction_information,
  );

  const isTransactionInformationFilled =
    !!transaction_information.client &&
    !!transaction_information.transaction_number;

  return (
    <div className="mt-5">
      <TransactionInformation
        onReset={useSalesPaymentStore.getState().clear}
        onSave={useSalesPaymentStore.getState().setTransactionInformation}
        isDisabled={isTransactionInformationFilled}
        onCheckTransactionNumber={async (trxNum) => {
          const res = await getSalesPaymentTransactionSummary(trxNum);
          return !!res.data;
        }}
      />
      {isTransactionInformationFilled && <ReceivablesTable />}
    </div>
  );
}
