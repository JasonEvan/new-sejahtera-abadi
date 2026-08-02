import jsPDF from "jspdf";
import type {
  AllPayablesTableRow,
  AllReceivablesTableRow,
  ClientPayablesTableRow,
  ClientReceivablesTableRow,
  InventoryLedgerTableRow,
  ProfitTableRow,
} from "@/modules/report/report.types";
import { usePrinterStore } from "@/lib/printer-store";
import { toast } from "sonner";

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

  async handlePrintContinuousForm(
    details: SalesInvoicePrintDetail[],
    total: SalesInvoiceTotal,
  ) {
    if (!details || details.length === 0) return;

    const printerStore = usePrinterStore.getState();

    if (!printerStore.isConnected) {
      toast.info(
        "Printer LX3100 Direct belum terhubung di Topbar. Menggunakan mode cetak PDF sebagai alternatif.",
        { duration: 4000 }
      );
      this.printContinuousFormPdf(details, total);
      return;
    }

    try {
      const payload = generateContinuousFormEscPos(details, total);
      const success = await printerStore.sendRawData(payload);

      if (success) {
        toast.success(
          `Nota ${details[0]?.nomor_nota || ""} berhasil dikirim ke printer LX3100!`
        );
      } else {
        toast.error(
          printerStore.error || "Gagal mengirim data ke printer LX3100."
        );
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Terjadi kesalahan saat mencetak";
      toast.error(errorMsg);
    }
  },

  printContinuousFormPdf(
    details: SalesInvoicePrintDetail[],
    total: SalesInvoiceTotal,
  ) {
    if (!details || details.length === 0) return;

    const totalText = formatTotal(total);
    const pdf = new jsPDF("p", "mm", [217, 140]);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.3);

    let needToChangePage = false;
    let y = 7;
    y = this.drawHeader(pdf, y, details);

    const colX = [5, 10, 80, 90, 110, 125];
    const columnWidths = [5, 70, 10, 20, 15, 15];
    const headers = ["No", "Nama Barang", "Qty", "Satuan", "Harga", "Total"];
    const numericalCols = [0, 2, 4, 5];
    headers.forEach((header, i) => {
      const x = numericalCols.includes(i)
        ? colX[i] + columnWidths[i] - pdf.getTextWidth(header) - 1
        : colX[i];
      pdf.text(header, x, y);
    });
    y += 5;

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

        y = this.drawHeader(pdf, y, details);

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
        width: 15,
        gapAfter: 2,
        align: "right",
        getValue: (row, index) => {
          if (row.name === "TOTAL") return "";
          return String(index + 1);
        },
      },
      { header: "Nama Client", width: 40, getValue: (row) => row.name },
      {
        header: "Total Nilai Nota",
        width: 40,
        align: "right",
        getValue: (row) => formatNumber(row.invoice_value),
      },
      {
        header: "Total Lunas",
        width: 40,
        align: "right",
        getValue: (row) => formatNumber(row.paid_amount),
      },
      {
        header: "Total Saldo",
        width: 40,
        align: "right",
        getValue: (row) => formatNumber(row.balance_due),
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
        width: 15,
        gapAfter: 2,
        align: "right",
        getValue: (row, index) => {
          if (row.name === "TOTAL") return "";
          return String(index + 1);
        },
      },
      { header: "Nama Client", width: 40, getValue: (row) => row.name },
      {
        header: "Total Nilai Nota",
        width: 40,
        align: "right",
        getValue: (row) => formatNumber(row.invoice_value),
      },
      {
        header: "Total Lunas",
        width: 40,
        align: "right",
        getValue: (row) => formatNumber(row.paid_amount),
      },
      {
        header: "Total Saldo",
        width: 40,
        align: "right",
        getValue: (row) => formatNumber(row.balance_due),
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

  handlePrintProfitReport(rows: ProfitTableRow[], monthName: string, year: number) {
    const columns: ReportColumn<ProfitTableRow>[] = [
      {
        header: "No",
        width: 8,
        gapAfter: 5,
        align: "right",
        getValue: (row) => {
          if (
            row.invoice_value === null ||
            row.invoice_number === "TOTAL" ||
            row.invoice_date === "GRAND TOTAL"
          ) {
            return "";
          }
          return row.row_number ? String(row.row_number) : "";
        },
      },
      {
        header: "Tanggal",
        width: 25,
        gapAfter: 5,
        getValue: (row) => {
          const isSalesHeader =
            row.invoice_value === null &&
            row.invoice_profit === null &&
            row.invoice_number !== "" &&
            row.invoice_number !== "TOTAL";

          if (isSalesHeader) {
            return row.invoice_number;
          }
          return row.invoice_date || "";
        },
      },
      {
        header: "Nomor Nota",
        width: 30,
        getValue: (row) => {
          const isSalesHeader =
            row.invoice_value === null &&
            row.invoice_profit === null &&
            row.invoice_number !== "" &&
            row.invoice_number !== "TOTAL";

          if (isSalesHeader) {
            return "";
          }
          return row.invoice_number || "";
        },
      },
      {
        header: "Nama Client",
        width: 42,
        getValue: (row) => row.client_name || "",
      },
      {
        header: "Kota",
        width: 22,
        getValue: (row) => row.client_city || "",
      },
      {
        header: "Nilai Nota",
        width: 27,
        align: "right",
        getValue: (row) =>
          row.invoice_value !== null ? formatNumber(row.invoice_value) : "",
      },
      {
        header: "Laba",
        width: 26,
        align: "right",
        getValue: (row) =>
          row.invoice_profit !== null ? formatNumber(row.invoice_profit) : "",
      },
    ];

    const pdf = new jsPDF("p", "mm", "a4");
    const leftMargin = 10;
    const topMargin = 12;
    const rowHeight = 5.5;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const bottomLimit = pageHeight - 10;

    const title = `LAPORAN LABA - ${monthName.toUpperCase()} ${year}`;

    const drawHeader = () => {
      let y = topMargin;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("SEJAHTERA ABADI", leftMargin, y);
      y += 5;
      pdf.text("SEMARANG", leftMargin, y);
      y += 5;
      pdf.text(title, leftMargin, y);
      y += 7;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
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
        y = drawHeader();
      }

      const isSalesHeader =
        row.invoice_value === null &&
        row.invoice_profit === null &&
        row.invoice_number !== "" &&
        row.invoice_number !== "TOTAL";

      const isTotal = row.invoice_number === "TOTAL";
      const isGrandTotal = row.invoice_date === "GRAND TOTAL";

      if (isSalesHeader || isTotal || isGrandTotal) {
        pdf.setFont("helvetica", "bold");
      } else {
        pdf.setFont("helvetica", "normal");
      }

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

    openPdfForPrint(pdf, `laporan-laba-${monthName.toLowerCase()}-${year}.pdf`);
  },
};

function padRight(str: string, length: number): string {
  if (str.length >= length) return str.substring(0, length);
  return str + " ".repeat(length - str.length);
}

function padLeft(str: string, length: number): string {
  if (str.length >= length) return str.substring(0, length);
  return " ".repeat(length - str.length) + str;
}

export function generateContinuousFormEscPos(
  details: SalesInvoicePrintDetail[],
  total: SalesInvoiceTotal,
): Uint8Array {
  if (!details || details.length === 0) return new Uint8Array(0);

  const header = details[0];
  const totalText = formatTotal(total);
  const numericTotal = parseTotalToNumber(total);
  const rupiahText = `${rupiahToString(numericTotal)} rupiah`;

  const encoder = new TextEncoder();
  const initBytes = new Uint8Array([
    0x1b, 0x40, // ESC @ (Initialize printer)
    0x1b, 0x78, 0x01, // ESC x 1 (NLQ High Quality Mode)
    0x1b, 0x6b, 0x01, // ESC k 1 (Sans Serif Font)
    0x1b, 0x50, // ESC P (10 CPI pitch)
    0x1b, 0x32, // ESC 2 (1/6 inch line spacing)
    0x1b, 0x43, 33, // ESC C 33 (Set page length to 33 lines - 5.5 inches)
    0x1b, 0x4f, // ESC O (Cancel bottom margin)
  ]);

  const itemsPerPage = 15;
  const totalItems = details.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  let textOutput = "";

  for (let page = 0; page < totalPages; page++) {
    const startIdx = page * itemsPerPage;
    const pageDetails = details.slice(startIdx, startIdx + itemsPerPage);

    const clientAddress = header.alamat_client
      ? `${header.alamat_client}${header.kota_client ? ", " + header.kota_client : ""}`
      : header.kota_client || "";

    textOutput += padRight("SA", 40) + padRight("KEPADA YTH", 40) + "\n";
    textOutput += padRight(header.tanggal_nota || "", 40) + padRight(header.nama_client || "", 40) + "\n";
    textOutput += padRight(header.nomor_nota || "", 40) + padRight(clientAddress, 40) + "\n";
    textOutput += padRight(header.kode_sales || "", 40) + padRight("", 40) + "\n";
    textOutput += "\n";

    const sep = "-".repeat(80);
    textOutput += sep + "\n";
    textOutput +=
      padLeft("No", 3) +
      " " +
      padRight("Nama Barang", 40) +
      " " +
      padLeft("Qty", 5) +
      " " +
      padRight("Satuan", 6) +
      " " +
      padLeft("Harga", 10) +
      " " +
      padLeft("Total", 11) +
      "\n";
    textOutput += sep + "\n";

    pageDetails.forEach((row, idx) => {
      const globalIdx = startIdx + idx + 1;
      const noStr = padLeft(String(globalIdx), 3);
      const namaStr = padRight(row.nama_barang || "", 40);
      const qtyStr = padLeft(row.qty_barang != null ? String(row.qty_barang) : "", 5);
      const satStr = padRight(row.satuan_barang || "", 6);
      const hargaStr = padLeft(formatNumber(row.harga_barang), 10);
      const totalStr = padLeft(formatNumber(row.total_harga), 11);

      textOutput += `${noStr} ${namaStr} ${qtyStr} ${satStr} ${hargaStr} ${totalStr}\n`;
    });

    const emptyLines = itemsPerPage - pageDetails.length;
    for (let i = 0; i < emptyLines; i++) {
      textOutput += "\n";
    }

    if (page === totalPages - 1) {
      const rupiahPart = padRight(rupiahText, 53);
      const totalPart = "TOTAL " + padLeft(totalText, 21);
      textOutput += rupiahPart + totalPart + "\n";
    } else {
      textOutput += "\n";
    }

    textOutput += "\x0C"; // Form Feed
  }

  const textBytes = encoder.encode(textOutput);
  const resultBytes = new Uint8Array(initBytes.length + textBytes.length);
  resultBytes.set(initBytes, 0);
  resultBytes.set(textBytes, initBytes.length);

  return resultBytes;
}

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
