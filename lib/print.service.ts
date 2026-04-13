import jsPDF from "jspdf";

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

export const printService = {
  drawHeader(pdf: jsPDF, y: number = 7, details: SalesInvoicePrintDetail[]) {
    const header = details[0];

    pdf.text("SA", 5, y);
    pdf.text(header.tanggal_nota, 80, y);
    pdf.text("KEPADA YTH", 105, y);
    pdf.text(header.nomor_nota, 80, y + 3);
    pdf.text(header.nama_client, 105, y + 3);
    pdf.text(header.kode_sales, 80, y + 6);
    const address = header.alamat_client
      ? `${header.alamat_client}${
          header.kota_client ? ", " + header.kota_client : ""
        }`
      : header.kota_client || "";
    pdf.text(address, 105, y + 6);

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

    // Total row
    pdf.text("TOTAL", colX[4], y);
    pdf.text(
      totalText,
      colX[5] + columnWidths[5] - pdf.getTextWidth(totalText) - 1,
      y,
    );
    y += 10;

    // Bottom text
    pdf.text(`${rupiahToString(parseTotalToNumber(total))} rupiah`, 5, y);

    // Generate PDF blob and open in new window for printing
    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, "_blank");

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = "nota.pdf";
      link.click();
    }
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
