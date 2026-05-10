import jsPDF from "jspdf";
import type {
  AllPayablesTableRow,
  AllReceivablesTableRow,
  ClientPayablesTableRow,
  ClientReceivablesTableRow,
  InventoryLedgerTableRow,
} from "@/modules/report/report.types";

export interface SalesInvoicePrintDetail {
  tanggal_nota: string;
  nomor_nota: string;
  nama_client: string;
  kode_sales: string;
  alamat_client: string;
  kota_client: string;
  nama_barang: string | null;
  qty_barang: number | string | null;
  satuan_barang: string | null;
  harga_barang: number | null;
  total_harga: number | null;
}

type SalesInvoiceTotal = number | string;

function formatTotal(total: SalesInvoiceTotal): string {
  if (typeof total === "number") {
    return total.toLocaleString("id-ID");
  }

  return total;
}

function parseTotalToNumber(total: SalesInvoiceTotal): number {
  if (typeof total === "number") {
    return total;
  }

  const numericText = total.replace(/[^\d-]/g, "");
  return Number.parseInt(numericText, 10) || 0;
}

function formatNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("id-ID");
}

type HorizontalAlign = "left" | "right";

interface ReportColumn<T> {
  header: string;
  width: number;
  gapAfter?: number;
  align?: HorizontalAlign;
  getValue: (row: T, index: number) => string;
}

function getColumnX<T>(
  columns: ReportColumn<T>[],
  columnIndex: number,
  leftMargin: number,
): number {
  return (
    leftMargin +
    columns
      .slice(0, columnIndex)
      .reduce(
        (acc, current) => acc + current.width + (current.gapAfter ?? 0),
        0,
      )
  );
}

function toPrintable(value: string | number | null): string {
  if (value === null) return "";
  return String(value);
}

function openPdfForPrint(pdf: jsPDF, fileName: string) {
  const pdfBlob = pdf.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(pdfUrl, "_blank");

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
    return;
  }

  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = fileName;
  link.click();
}

export const printService = {
  drawHeader(pdf: jsPDF, y: number = 7, details: SalesInvoicePrintDetail[]) {
    const header = details[0];

    pdf.text("SA", 5, y);
    const clientInfoX = 135; // Target right margin
    const kepadaYth = "KEPADA YTH";
    const namaClient = header.nama_client;
    const address = header.alamat_client
      ? `${header.alamat_client}${
          header.kota_client ? ", " + header.kota_client : ""
        }`
      : header.kota_client || "";

    const maxClientInfoWidth = Math.max(
      pdf.getTextWidth(kepadaYth),
      pdf.getTextWidth(namaClient),
      pdf.getTextWidth(address),
    );

    const dynamicX = clientInfoX - maxClientInfoWidth;

    // Calculate dynamic x for the left block to prevent overlap
    const gap = 5;
    const maxLeftBlockWidth = Math.max(
      pdf.getTextWidth(header.tanggal_nota),
      pdf.getTextWidth(header.nomor_nota),
      pdf.getTextWidth(header.kode_sales),
    );
    const leftBlockX = dynamicX - gap - maxLeftBlockWidth;

    pdf.text(header.tanggal_nota, leftBlockX, y);
    pdf.text(kepadaYth, dynamicX, y);
    pdf.text(header.nomor_nota, leftBlockX, y + 3);
    pdf.text(namaClient, dynamicX, y + 3);
    pdf.text(header.kode_sales, leftBlockX, y + 6);
    pdf.text(address, dynamicX, y + 6);

    return y + 16; // Return new y position after header
  },

  handlePrintContinuousForm(
    details: SalesInvoicePrintDetail[],
    total: SalesInvoiceTotal,
  ) {
    if (!details || details.length === 0) return;

    const totalText = formatTotal(total);

    const pdf = new jsPDF("p", "mm", [217, 140]);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.3);

    let needToChangePage = false;

    // Add header
    let y = 7;
    y = this.drawHeader(pdf, y, details);

    // Table headers
    const colX = [5, 10, 80, 90, 110, 125];
    const columnWidths = [5, 70, 10, 20, 15, 15];
    const headers = ["No", "Nama Barang", "Qty", "Satuan", "Harga", "Total"];
    const numericalCols = [0, 2, 4, 5];
    headers.forEach((header, i) => {
      // Align right for numerical columns
      // -1 for padding
      const x = numericalCols.includes(i)
        ? colX[i] + columnWidths[i] - pdf.getTextWidth(header) - 1
        : colX[i];
      pdf.text(header, x, y);
    });
    y += 5;

    // Table rows
    let rowCount = 0;
    details.forEach((row, index) => {
      const texts = [
        (index + 1).toString(),
        row.nama_barang ?? "",
        row.qty_barang != null ? String(row.qty_barang) : "",
        row.satuan_barang ?? "",
        formatNumber(row.harga_barang),
        formatNumber(row.total_harga),
      ];

      texts.forEach((text, i) => {
        const x = numericalCols.includes(i)
          ? colX[i] + columnWidths[i] - pdf.getTextWidth(text) - 1
          : colX[i];
        pdf.text(text, x, y);
      });

      y += 4;
      rowCount++;

      if (rowCount % 15 === 0 && index < details.length - 2) {
        if (needToChangePage) {
          pdf.addPage();
          y = 7;
          needToChangePage = false;
        } else {
          y += 28;
          needToChangePage = true;
        }

        // Redraw header
        y = this.drawHeader(pdf, y, details);

        // Redraw table headers
        headers.forEach((header, i) => {
          const x = numericalCols.includes(i)
            ? colX[i] + columnWidths[i] - pdf.getTextWidth(header) - 1
            : colX[i];
          pdf.text(header, x, y);
        });
        y += 5;
      }
    });
    y += 2;

    // Total row and Bottom text
    const bottomText = `${rupiahToString(parseTotalToNumber(total))} rupiah`;
    const bottomTextWidth = pdf.getTextWidth(bottomText);
    const totalLabelX = colX[4];
    const canBeOnSameLine = 5 + bottomTextWidth + 5 < totalLabelX;

    if (canBeOnSameLine) {
      pdf.text(bottomText, 5, y);
      pdf.text("TOTAL", totalLabelX, y);
      pdf.text(
        totalText,
        colX[5] + columnWidths[5] - pdf.getTextWidth(totalText) - 1,
        y,
      );
    } else {
      pdf.text("TOTAL", totalLabelX, y);
      pdf.text(
        totalText,
        colX[5] + columnWidths[5] - pdf.getTextWidth(totalText) - 1,
        y,
      );
      y += 10;
      pdf.text(bottomText, 5, y);
    }

    openPdfForPrint(pdf, "nota.pdf");
  },

  printA4Report<T>(
    title: string,
    rows: T[],
    columns: ReportColumn<T>[],
    fileName: string,
  ) {
    const pdf = new jsPDF("p", "mm", "a4");
    const leftMargin = 10;
    const topMargin = 12;
    const rowHeight = 5.5;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const bottomLimit = pageHeight - 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);

    const drawHeader = () => {
      let y = topMargin;
      pdf.text("SEJAHTERA ABADI", leftMargin, y);
      y += 5;
      pdf.text("SEMARANG", leftMargin, y);
      y += 5;
      pdf.text(title, leftMargin, y);
      y += 7;

      pdf.setFontSize(9);
      columns.forEach((column, columnIndex) => {
        const x = getColumnX(columns, columnIndex, leftMargin);
        const textWidth = pdf.getTextWidth(column.header);
        const textX =
          column.align === "right" ? x + column.width - textWidth : x;
        pdf.text(column.header, textX, y);
      });

      return y + 4;
    };

    let y = drawHeader();

    rows.forEach((row, index) => {
      if (y + rowHeight > bottomLimit) {
        pdf.addPage();
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        y = drawHeader();
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      columns.forEach((column, columnIndex) => {
        const cellText = column.getValue(row, index);
        const x = getColumnX(columns, columnIndex, leftMargin);
        const textWidth = pdf.getTextWidth(cellText);
        const textX =
          column.align === "right" ? x + column.width - textWidth : x;

        pdf.text(cellText, textX, y);
      });

      y += rowHeight;
    });

    openPdfForPrint(pdf, fileName);
  },

  handlePrintInventoryLedger(
    rows: InventoryLedgerTableRow[],
    stockName: string,
  ) {
    const columns: ReportColumn<InventoryLedgerTableRow>[] = [
      {
        header: "No",
        width: 10,
        gapAfter: 2,
        align: "right",
        getValue: (row, index) => {
          if (row.name === "SALDO AWAL" || row.name === "TOTAL QTY") return "";
          return String(index);
        },
      },
      {
        header: "Nomor Nota",
        width: 28,
        getValue: (row) => toPrintable(row.invoice_number),
      },
      {
        header: "Tanggal",
        width: 25,
        getValue: (row) => toPrintable(row.invoice_date),
      },
      { header: "Nama", width: 38, getValue: (row) => toPrintable(row.name) },
      { header: "Kota", width: 24, getValue: (row) => toPrintable(row.city) },
      { header: "Tipe", width: 12, getValue: (row) => toPrintable(row.type) },
      {
        header: "Harga",
        width: 16,
        align: "right",
        getValue: (row) => toPrintable(row.price),
      },
      {
        header: "Qty In",
        width: 12,
        align: "right",
        getValue: (row) => toPrintable(row.qty_in),
      },
      {
        header: "Qty Out",
        width: 14,
        align: "right",
        getValue: (row) => toPrintable(row.qty_out),
      },
      {
        header: "Qty Akhir",
        width: 16,
        align: "right",
        getValue: (row) => toPrintable(row.final_qty),
      },
    ];

    this.printA4Report(
      `LAPORAN KARTU PERSEDIAAN ${stockName}`,
      rows,
      columns,
      "inventory-ledger.pdf",
    );
  },

  handlePrintAllReceivables(rows: AllReceivablesTableRow[]) {
    const columns: ReportColumn<AllReceivablesTableRow>[] = [
      {
        header: "No",
        width: 10,
        gapAfter: 2,
        align: "right",
        getValue: (row, index) => {
          if (row.invoice_number === "TOTAL") return "";
          return String(index + 1);
        },
      },
      { header: "Nama", width: 35, getValue: (row) => row.name },
      {
        header: "Nomor Nota",
        width: 28,
        getValue: (row) => row.invoice_number,
      },
      {
        header: "Tanggal",
        width: 25,
        getValue: (row) => toPrintable(row.invoice_date),
      },
      {
        header: "Nilai Nota",
        width: 18,
        align: "right",
        getValue: (row) => toPrintable(row.invoice_value),
      },
      {
        header: "Lunas",
        width: 18,
        gapAfter: 2,
        align: "right",
        getValue: (row) => toPrintable(row.paid_amount),
      },
      {
        header: "Tgl Bayar",
        width: 18,
        getValue: (row) => toPrintable(row.payment_date),
      },
      {
        header: "Saldo",
        width: 16,
        align: "right",
        getValue: (row) => toPrintable(row.balance_due),
      },
    ];

    this.printA4Report("LAPORAN PIUTANG", rows, columns, "all-receivables.pdf");
  },

  handlePrintReceivablesPerClient(
    rows: ClientReceivablesTableRow[],
    clientName: string,
  ) {
    const columns: ReportColumn<ClientReceivablesTableRow>[] = [
      {
        header: "No",
        width: 10,
        gapAfter: 2,
        align: "right",
        getValue: (row, index) => {
          if (row.invoice_number === "TOTAL") return "";
          return String(index + 1);
        },
      },
      {
        header: "Nomor Nota",
        width: 34,
        getValue: (row) => row.invoice_number,
      },
      {
        header: "Tanggal",
        width: 32,
        getValue: (row) => toPrintable(row.invoice_date),
      },
      {
        header: "Nilai Nota",
        width: 28,
        align: "right",
        getValue: (row) => toPrintable(row.invoice_value),
      },
      {
        header: "Lunas",
        width: 28,
        gapAfter: 2,
        align: "right",
        getValue: (row) => toPrintable(row.paid_amount),
      },
      {
        header: "Tanggal Lunas",
        width: 28,
        getValue: (row) => toPrintable(row.payment_date),
      },
      {
        header: "Saldo",
        width: 28,
        align: "right",
        getValue: (row) => toPrintable(row.balance_due),
      },
    ];

    this.printA4Report(
      `LAPORAN PIUTANG ${clientName}`,
      rows,
      columns,
      "receivables-per-client.pdf",
    );
  },

  handlePrintAllPayables(rows: AllPayablesTableRow[]) {
    const columns: ReportColumn<AllPayablesTableRow>[] = [
      {
        header: "No",
        width: 10,
        gapAfter: 2,
        align: "right",
        getValue: (row, index) => {
          if (row.invoice_number === "TOTAL") return "";
          return String(index + 1);
        },
      },
      { header: "Nama", width: 35, getValue: (row) => row.name },
      {
        header: "Nomor Nota",
        width: 28,
        getValue: (row) => row.invoice_number,
      },
      {
        header: "Tanggal",
        width: 25,
        getValue: (row) => toPrintable(row.invoice_date),
      },
      {
        header: "Nilai Nota",
        width: 18,
        align: "right",
        getValue: (row) => toPrintable(row.invoice_value),
      },
      {
        header: "Lunas",
        width: 18,
        gapAfter: 2,
        align: "right",
        getValue: (row) => toPrintable(row.paid_amount),
      },
      {
        header: "Tgl Bayar",
        width: 18,
        getValue: (row) => toPrintable(row.payment_date),
      },
      {
        header: "Saldo",
        width: 16,
        align: "right",
        getValue: (row) => toPrintable(row.balance_due),
      },
    ];

    this.printA4Report("LAPORAN UTANG", rows, columns, "all-payables.pdf");
  },

  handlePrintPayablesPerClient(
    rows: ClientPayablesTableRow[],
    clientName: string,
  ) {
    const columns: ReportColumn<ClientPayablesTableRow>[] = [
      {
        header: "No",
        width: 10,
        gapAfter: 2,
        align: "right",
        getValue: (row, index) => {
          if (row.invoice_number === "TOTAL") return "";
          return String(index + 1);
        },
      },
      {
        header: "Nomor Nota",
        width: 34,
        getValue: (row) => row.invoice_number,
      },
      {
        header: "Tanggal",
        width: 32,
        getValue: (row) => toPrintable(row.invoice_date),
      },
      {
        header: "Nilai Nota",
        width: 28,
        align: "right",
        getValue: (row) => toPrintable(row.invoice_value),
      },
      {
        header: "Lunas",
        width: 28,
        gapAfter: 2,
        align: "right",
        getValue: (row) => toPrintable(row.paid_amount),
      },
      {
        header: "Tanggal Lunas",
        width: 28,
        getValue: (row) => toPrintable(row.payment_date),
      },
      {
        header: "Saldo",
        width: 28,
        align: "right",
        getValue: (row) => toPrintable(row.balance_due),
      },
    ];

    this.printA4Report(
      `LAPORAN UTANG ${clientName}`,
      rows,
      columns,
      "payables-per-client.pdf",
    );
  },
};

const units = [
  "nol",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

const tens = [
  "",
  "",
  "dua puluh",
  "tiga puluh",
  "empat puluh",
  "lima puluh",
  "enam puluh",
  "tujuh puluh",
  "delapan puluh",
  "sembilan puluh",
];

export function rupiahToString(value: number): string {
  value = Math.floor(value);

  if (value < 12) return units[value];
  if (value < 20) return units[value - 10] + " belas";
  if (value < 100) {
    const puluh = tens[Math.floor(value / 10)];
    const satuan = value % 10 === 0 ? "" : units[value % 10];
    return (puluh + " " + satuan).trim();
  }
  if (value < 200) {
    const rest = rupiahToString(value - 100);
    return ("seratus " + (rest === "nol" ? "" : rest)).trim();
  }
  if (value < 1000) {
    const ratus = units[Math.floor(value / 100)];
    const rest = rupiahToString(value % 100);
    return (ratus + " ratus " + (rest === "nol" ? "" : rest)).trim();
  }
  if (value < 2000) {
    const rest = rupiahToString(value - 1000);
    return ("seribu " + (rest === "nol" ? "" : rest)).trim();
  }
  if (value < 1000000) {
    const ribu = rupiahToString(Math.floor(value / 1000));
    const rest = rupiahToString(value % 1000);
    return (ribu + " ribu " + (rest === "nol" ? "" : rest)).trim();
  }
  if (value < 1000000000) {
    const juta = rupiahToString(Math.floor(value / 1000000));
    const rest = rupiahToString(value % 1000000);
    return (juta + " juta " + (rest === "nol" ? "" : rest)).trim();
  }

  return "nomor terlalu besar";
}
