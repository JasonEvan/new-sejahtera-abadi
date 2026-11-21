export interface PaymentDraftRow {
  id: string;
  payment_date: string;
  invoice_number: string;
  invoice_value: number;
  paid_amount: number;
}

type OriginalPayment = PaymentDraftRow & { balance_due: number };

export interface EditablePaymentDraftRow extends PaymentDraftRow {
  balance_due: number;
  max_paid_amount: number;
}

interface PaymentDraftState {
  activeInvoiceNumber: string | null;
  tableRows: EditablePaymentDraftRow[];
  baselineByInvoice: ReadonlyMap<string, number>;
}

type PaymentDraftAction =
  | { type: "SET_DATA"; transactionNumber: string; payments: OriginalPayment[] }
  | { type: "ADD_ROW"; row: PaymentDraftRow; invoiceBalance: number }
  | { type: "EDIT_ROW"; id: string; paidAmount: number }
  | { type: "DELETE_ROW"; id: string }
  | { type: "RESET" };

export const initialPaymentDraftState: PaymentDraftState = {
  activeInvoiceNumber: null,
  tableRows: [],
  baselineByInvoice: new Map(),
};

function recalculateRows(
  rows: PaymentDraftRow[],
  baselineByInvoice: ReadonlyMap<string, number>,
): EditablePaymentDraftRow[] {
  const paidByInvoice = new Map<string, number>();
  for (const row of rows) {
    const invoice = row.invoice_number;
    paidByInvoice.set(
      invoice,
      (paidByInvoice.get(invoice) ?? 0) + row.paid_amount,
    );
  }

  return rows.map((row) => {
    const baseline = baselineByInvoice.get(row.invoice_number)!;
    const paid = paidByInvoice.get(row.invoice_number)!;
    const remaining = baseline - paid;

    return {
      ...row,
      balance_due: Math.max(remaining, 0),
      max_paid_amount: Math.max(remaining + row.paid_amount, 0),
    };
  });
}

export function paymentDraftReducer(
  state: PaymentDraftState,
  action: PaymentDraftAction,
): PaymentDraftState {
  switch (action.type) {
    case "SET_DATA": {
      const baselineByInvoice = new Map<string, number>();
      for (const payment of action.payments) {
        const invoice = payment.invoice_number;
        // The summary repeats the order's current balance on each payment row.
        const baseline = baselineByInvoice.get(invoice) ?? payment.balance_due;
        baselineByInvoice.set(invoice, baseline + payment.paid_amount);
      }
      return {
        activeInvoiceNumber: action.transactionNumber,
        baselineByInvoice,
        tableRows: recalculateRows(action.payments, baselineByInvoice),
      };
    }
    case "ADD_ROW": {
      let baselineByInvoice = state.baselineByInvoice;
      if (!baselineByInvoice.has(action.row.invoice_number)) {
        baselineByInvoice = new Map(baselineByInvoice).set(
          action.row.invoice_number,
          action.invoiceBalance,
        );
      }
      return {
        ...state,
        baselineByInvoice,
        tableRows: recalculateRows(
          [...state.tableRows, action.row],
          baselineByInvoice,
        ),
      };
    }
    case "EDIT_ROW":
      return {
        ...state,
        tableRows: recalculateRows(
          state.tableRows.map((row) =>
            row.id === action.id
              ? { ...row, paid_amount: action.paidAmount }
              : row,
          ),
          state.baselineByInvoice,
        ),
      };
    case "DELETE_ROW":
      return {
        ...state,
        tableRows: recalculateRows(
          state.tableRows.filter((row) => row.id !== action.id),
          state.baselineByInvoice,
        ),
      };
    case "RESET":
      return initialPaymentDraftState;
  }
}
