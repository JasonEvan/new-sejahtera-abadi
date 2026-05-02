import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { saleService } from "@/modules/sale/sale.service";
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { PassThrough, Readable } from "stream";

export const GET = withErrorHandler(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ "invoice-number": string }> },
  ) => {
    const session = await getSession();

    if (!session || !session.permissions?.includes("sales.view")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { "invoice-number": invoiceNumber } = await params;

    const data = await saleService.getSalesInvoiceDetail(
      decodeURIComponent(invoiceNumber),
    );
    const { header, lines } = data;

    const stream = new PassThrough();
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: stream,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet("Sales Invoice");

    // Set column widths
    worksheet.columns = [
      { header: "", key: "c1", width: 25 },
      { header: "", key: "c2", width: 15 },
      { header: "", key: "c3", width: 15 },
      { header: "", key: "c4", width: 15 },
      { header: "", key: "c5", width: 20 },
    ];

    // Add header information
    worksheet.addRow(["Nomor Nota", header.invoice_number]).commit();
    worksheet.addRow(["Tanggal", header.invoice_date]).commit();
    worksheet.addRow(["Client", header.client_name]).commit();
    worksheet.addRow(["Kota", header.client_city]).commit();
    worksheet.addRow(["Total Nilai", header.invoice_value]).commit();
    worksheet.addRow([]).commit(); // Empty row

    // Add lines table
    const headerRow = worksheet.addRow([
      "Nama Barang",
      "Qty",
      "Satuan",
      "Harga",
      "Total Harga",
    ]);
    headerRow.font = { bold: true };
    headerRow.commit();

    lines.forEach((line) => {
      const row = worksheet.addRow([
        line.name,
        line.qty,
        line.unit,
        line.price,
        line.total_price,
      ]);
      if (line.name === "TOTAL") {
        row.font = { bold: true };
      }
      row.commit();
    });

    // Finalize the worksheet and workbook
    worksheet.commit();
    workbook.commit();

    return new NextResponse(Readable.toWeb(stream) as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Invoice-${header.invoice_number}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  },
);
