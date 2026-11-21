import {
  initialPaymentDraftState,
  paymentDraftReducer,
  type PaymentDraftRow,
} from "./payment-draft";

function payment(id: string, invoice: string, paid: number): PaymentDraftRow {
  return {
    id,
    invoice_number: invoice,
    invoice_value: 100,
    payment_date: "2026-01-01",
    paid_amount: paid,
  };
}

function amounts(state: typeof initialPaymentDraftState) {
  return state.tableRows.map(
    ({ id, paid_amount, balance_due, max_paid_amount }) => [
      id,
      paid_amount,
      balance_due,
      max_paid_amount,
    ],
  );
}

describe("paymentDraftReducer", () => {
  it("keeps the original balance when repeatedly editing a newly added invoice", () => {
    const loaded = paymentDraftReducer(initialPaymentDraftState, {
      type: "SET_DATA",
      transactionNumber: "payment-1",
      payments: [{ ...payment("1", "old", 25), balance_due: 75 }],
    });
    const added = paymentDraftReducer(loaded, {
      type: "ADD_ROW",
      row: payment("2", "new", 40),
      invoiceBalance: 100,
    });
    expect(amounts(added)).toEqual([
      ["1", 25, 75, 100],
      ["2", 40, 60, 100],
    ]);

    const edited = paymentDraftReducer(added, {
      type: "EDIT_ROW",
      id: "2",
      paidAmount: 80,
    });
    expect(amounts(edited)).toEqual([
      ["1", 25, 75, 100],
      ["2", 80, 20, 100],
    ]);

    const full = paymentDraftReducer(edited, {
      type: "EDIT_ROW",
      id: "2",
      paidAmount: 100,
    });
    expect(amounts(full)[1]).toEqual(["2", 100, 0, 100]);
    const deleted = paymentDraftReducer(full, { type: "DELETE_ROW", id: "2" });
    expect(amounts(deleted)).toEqual([["1", 25, 75, 100]]);
    expect(paymentDraftReducer(full, { type: "RESET" })).toEqual({
      activeInvoiceNumber: null,
      baselineByInvoice: new Map(),
      tableRows: [],
    });
  });

  it("counts a split invoice's DB balance once and limits each row by the other allocations", () => {
    const loaded = paymentDraftReducer(initialPaymentDraftState, {
      type: "SET_DATA",
      transactionNumber: "payment-2",
      payments: [
        { ...payment("1", "split", 20), balance_due: 50 },
        { ...payment("2", "split", 30), balance_due: 50 },
      ],
    });
    expect(amounts(loaded)).toEqual([
      ["1", 20, 50, 70],
      ["2", 30, 50, 80],
    ]);

    const edited = paymentDraftReducer(loaded, {
      type: "EDIT_ROW",
      id: "1",
      paidAmount: 70,
    });
    expect(amounts(edited)).toEqual([
      ["1", 70, 0, 70],
      ["2", 30, 0, 30],
    ]);

    const deleted = paymentDraftReducer(edited, {
      type: "DELETE_ROW",
      id: "2",
    });
    expect(amounts(deleted)).toEqual([["1", 70, 30, 100]]);
    const zero = paymentDraftReducer(deleted, {
      type: "EDIT_ROW",
      id: "1",
      paidAmount: 0,
    });
    expect(amounts(zero)).toEqual([["1", 0, 100, 100]]);
  });
});
