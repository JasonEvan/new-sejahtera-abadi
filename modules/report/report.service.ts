import dayjs from "dayjs";
import { stockRepository } from "../stock/stock.repository";
import { companyRepository } from "../company/company.repository";
import { reportRepository } from "./report.repository";
import {
  AllPayablesTableRow,
  AllReceivablesTableRow,
  ClientPayablesTableRow,
  ClientReceivablesTableRow,
  DashboardSnapshot,
  InventoryLedgerTableRow,
  ProfitQueryResult,
  ProfitTableRow,
} from "./report.types";

export const reportService = {
  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    const settings = await companyRepository.getSettings();
    return reportRepository.getDashboardSnapshot(settings.timezone);
  },

  async getInventoryLedgers(stockId: number) {
    const data = await reportRepository.getInventoryLedgers(stockId);
    const [stock] = await stockRepository.getStartingStock(stockId);

    let runningStock = stock.initial_stock;
    let totalQtyIn = 0;
    let totalQtyOut = 0;
    let rowNumber = 1;
    const tableRows: InventoryLedgerTableRow[] = [];

    // Saldo Awal
    tableRows.push({
      invoice_number: null,
      invoice_date: null,
      name: "SALDO AWAL",
      city: null,
      type: null,
      price: null,
      qty_in: null,
      qty_out: null,
      final_qty: runningStock,
    });

    // Proses Baris demi Baris (Sudah bersih dan kronologis dari Database!)
    data.forEach((row) => {
      let qtyIn = 0;
      let qtyOut = 0;
      const currentQty = row.qty;

      // Barang Masuk: Beli ("B") atau Retur Jual ("JR")
      if (row.type === "B" || row.type === "JR") {
        qtyIn = currentQty;
        runningStock += qtyIn;
        totalQtyIn += qtyIn;
      }
      // Barang Keluar: Jual ("J") atau Retur Beli ("BR")
      else if (row.type === "J" || row.type === "BR") {
        qtyOut = currentQty;
        runningStock -= qtyOut;
        totalQtyOut += qtyOut;
      }

      tableRows.push({
        row_number: rowNumber++,
        invoice_number: row.invoice_number,
        invoice_date: dayjs(row.invoice_date).format("DD/MM/YYYY"), // Pake row.date dari query baru
        name: row.name,
        city: row.city,
        type: row.type as "B" | "J" | "BR" | "JR",
        price: row.price,
        qty_in: qtyIn > 0 ? qtyIn : null,
        qty_out: qtyOut > 0 ? qtyOut : null,
        final_qty: runningStock,
      });
    });

    // Total Footer
    tableRows.push({
      invoice_number: null,
      invoice_date: null,
      name: "TOTAL QTY",
      city: null,
      type: null,
      price: null,
      qty_in: totalQtyIn,
      qty_out: totalQtyOut,
      final_qty: runningStock,
    });

    return tableRows;
  },

  async getAllPayables() {
    const data = await reportRepository.getAllPayables();

    let totalInvoiceValue = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;

    const tableRows: AllPayablesTableRow[] = [
      ...data.map((row) => {
        totalInvoiceValue += row.invoice_value;
        totalPaidAmount += row.paid_amount;
        totalRemainingAmount += row.balance_due;

        return {
          name: row.name,
          city: row.city,
          invoice_number: row.invoice_number,
          invoice_date: dayjs(row.invoice_date).format("DD/MM/YYYY"),
          invoice_value: row.invoice_value,
          paid_amount: row.paid_amount,
          payment_date: row.payment_date
            ? dayjs(row.payment_date).format("DD/MM/YYYY")
            : null,
          balance_due: row.balance_due,
        };
      }),
      {
        name: "",
        city: "",
        invoice_number: "TOTAL",
        invoice_date: null,
        invoice_value: totalInvoiceValue,
        paid_amount: totalPaidAmount,
        payment_date: null,
        balance_due: totalRemainingAmount,
      },
    ];

    return tableRows;
  },

  async getPayablesByClient(clientId: number) {
    const data = await reportRepository.getPayablesByClient(clientId);

    let totalInvoiceValue = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;

    const tableRows: ClientPayablesTableRow[] = [
      ...data.map((row) => {
        totalInvoiceValue += row.invoice_value;
        totalPaidAmount += row.paid_amount;
        totalRemainingAmount += row.balance_due;

        return {
          invoice_number: row.invoice_number,
          invoice_date: dayjs(row.invoice_date).format("DD/MM/YYYY"),
          invoice_value: row.invoice_value,
          paid_amount: row.paid_amount,
          payment_date: row.payment_date
            ? dayjs(row.payment_date).format("DD/MM/YYYY")
            : null,
          balance_due: row.balance_due,
        };
      }),
      {
        invoice_number: "TOTAL",
        invoice_date: null,
        invoice_value: totalInvoiceValue,
        paid_amount: totalPaidAmount,
        payment_date: null,
        balance_due: totalRemainingAmount,
      },
    ];

    return tableRows;
  },

  async getAllReceivables() {
    const data = await reportRepository.getAllReceivables();

    let totalInvoiceValue = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;

    const tableRows: AllReceivablesTableRow[] = [
      ...data.map((row) => {
        totalInvoiceValue += row.invoice_value;
        totalPaidAmount += row.paid_amount;
        totalRemainingAmount += row.balance_due;

        return {
          name: row.name,
          city: row.city,
          invoice_number: row.invoice_number,
          invoice_date: dayjs(row.invoice_date).format("DD/MM/YYYY"),
          invoice_value: row.invoice_value,
          paid_amount: row.paid_amount,
          payment_date: row.payment_date
            ? dayjs(row.payment_date).format("DD/MM/YYYY")
            : null,
          balance_due: row.balance_due,
        };
      }),
      {
        name: "",
        city: "",
        invoice_number: "TOTAL",
        invoice_date: null,
        invoice_value: totalInvoiceValue,
        paid_amount: totalPaidAmount,
        payment_date: null,
        balance_due: totalRemainingAmount,
      },
    ];

    return tableRows;
  },

  async getReceivablesByClient(clientId: number) {
    const data = await reportRepository.getReceivablesByClient(clientId);

    let totalInvoiceValue = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;

    const tableRows: ClientReceivablesTableRow[] = [
      ...data.map((row) => {
        totalInvoiceValue += row.invoice_value;
        totalPaidAmount += row.paid_amount;
        totalRemainingAmount += row.balance_due;

        return {
          invoice_number: row.invoice_number,
          invoice_date: dayjs(row.invoice_date).format("DD/MM/YYYY"),
          invoice_value: row.invoice_value,
          paid_amount: row.paid_amount,
          payment_date: row.payment_date
            ? dayjs(row.payment_date).format("DD/MM/YYYY")
            : null,
          balance_due: row.balance_due,
        };
      }),
      {
        invoice_number: "TOTAL",
        invoice_date: null,
        invoice_value: totalInvoiceValue,
        paid_amount: totalPaidAmount,
        payment_date: null,
        balance_due: totalRemainingAmount,
      },
    ];

    return tableRows;
  },

  async getProfits(month: number, year: number) {
    const settings = await companyRepository.getSettings();
    const queryResult = await reportRepository.getProfits(
      month,
      year,
      settings.timezone,
    );
    const results = queryResult as unknown as ProfitQueryResult[];

    // Grouped by sales_name
    const formattedResults = results.reduce(
      (acc, curr) => {
        const key = curr.sales_name;
        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push(curr);
        return acc;
      },
      {} as Record<string, ProfitQueryResult[]>,
    );

    const tableRows: ProfitTableRow[] = [];
    let grandTotalProfit = 0;
    let grandTotalValue = 0;
    Object.keys(formattedResults).forEach((salesName) => {
      let rowNumber = 1;
      tableRows.push({
        invoice_number: salesName,
        invoice_date: "",
        client_name: "",
        client_city: "",
        invoice_value: null,
        invoice_profit: null,
      });

      const salesData = formattedResults[salesName];
      let totalInvoiceValue = 0;
      let totalInvoiceProfit = 0;
      salesData.forEach((data) => {
        totalInvoiceValue += data.invoice_value;
        totalInvoiceProfit += Number(data.invoice_profit);
        tableRows.push({
          row_number: rowNumber++,
          invoice_number: data.invoice_number,
          invoice_date: dayjs(data.invoice_date).format("DD/MM/YYYY"),
          client_name: data.client_name,
          client_city: data.client_city,
          invoice_value: data.invoice_value,
          invoice_profit: Number(data.invoice_profit),
        });
      });
      grandTotalProfit += totalInvoiceProfit;
      grandTotalValue += totalInvoiceValue;

      tableRows.push({
        invoice_number: "TOTAL",
        invoice_date: "",
        client_name: "",
        client_city: "",
        invoice_value: totalInvoiceValue,
        invoice_profit: totalInvoiceProfit,
      });

      tableRows.push({
        invoice_number: "",
        invoice_date: "",
        client_name: "",
        client_city: "",
        invoice_value: null,
        invoice_profit: null,
      });
    });

    tableRows.push({
      invoice_number: "",
      invoice_date: "GRAND TOTAL",
      client_name: "",
      client_city: "",
      invoice_value: grandTotalValue,
      invoice_profit: grandTotalProfit,
    });

    return tableRows;
  },
};
