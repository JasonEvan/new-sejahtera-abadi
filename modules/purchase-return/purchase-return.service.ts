import db from "@/lib/drizzle";
import { purchaseReturnRepository } from "./purchase-return.repository";
import {
  InsertPurchaseReturn,
  UpdatePurchaseReturn,
} from "./purchase-return.types";
import { AppError } from "@/lib/errors";
import { purchaseReturnLineRepository } from "./purchase-return-line.repository";
import { purchaseOrderLineRepository } from "../purchase/purchase-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { purchaseOrderRepository } from "../purchase/purchase-order.repository";
import { clientRepository } from "../client/client.repository";
import { Tx } from "@/lib/common-types";

type ReturnLine = InsertPurchaseReturn["lines"][number];
type StockReturnLine = { stock_id: number | null; return_qty: number };
type ValidatedReturnLine = ReturnLine & { price: number; stock_id: number };
type InvoiceTotals = { id: number; client_id: number; invoice_value: number };

function addQuantity(quantities: Map<number, number>, id: number, qty: number) {
  quantities.set(id, (quantities.get(id) ?? 0) + qty);
}

function stockQuantities(lines: StockReturnLine[]) {
  const quantities = new Map<number, number>();
  for (const line of lines) {
    if (line.stock_id != null && line.stock_id > 0) {
      addQuantity(quantities, line.stock_id, line.return_qty);
    }
  }
  return quantities;
}

function stockUpdates(quantities: Map<number, number>) {
  return Array.from(quantities, ([id, quantity]) => ({ id, quantity }));
}

async function getValidatedLines(
  orderId: number,
  lines: ReturnLine[],
  oldLines: ReturnLine[],
  tx: Tx,
): Promise<ValidatedReturnLine[]> {
  const requested = new Map<number, number>();
  for (const line of lines) {
    addQuantity(requested, line.purchase_order_line_id, line.return_qty);
  }
  if (requested.size === 0 && oldLines.length === 0) return [];

  const orderLines = await purchaseOrderLineRepository.getByPurchaseOrderId(
    orderId,
    tx,
  );
  const byId = new Map(orderLines.map((line) => [line.id, line]));
  const restored = new Map<number, number>();
  for (const line of oldLines) {
    if (!byId.has(line.purchase_order_line_id)) {
      throw outsideInvoice(line.purchase_order_line_id);
    }
    addQuantity(restored, line.purchase_order_line_id, line.return_qty);
  }
  const validated: ValidatedReturnLine[] = [];
  for (const [id, qty] of requested) {
    const line = byId.get(id);
    if (!line) throw outsideInvoice(id);
    if (qty === 0) continue;
    if (qty > line.qty + (restored.get(id) ?? 0)) {
      throw new AppError(
        `Jumlah retur melebihi jumlah barang pada line ${id}`,
        400,
      );
    }
    validated.push({
      purchase_order_line_id: id,
      return_qty: qty,
      price: line.price,
      stock_id: line.stock_id ?? 0,
    });
  }
  return validated;
}

function outsideInvoice(lineId: number) {
  return new AppError(
    `Order line ${lineId} does not belong to selected invoice`,
    400,
  );
}

async function lockReturnStocks(
  requested: Map<number, number>,
  restored: Map<number, number>,
  tx: Tx,
) {
  const ids = Array.from(new Set([...requested.keys(), ...restored.keys()]));
  if (ids.length === 0) return;
  const stocks = await stockRepository.getStocksForUpdate(
    ids.sort((a, b) => a - b),
    tx,
  );
  const byId = new Map(stocks.map((stock) => [stock.id, stock.ending_stock]));
  for (const id of ids) {
    const endingStock = byId.get(id);
    if (endingStock === undefined) {
      throw new AppError(`Stok ${id} tidak ditemukan`, 404);
    }
    const requestedQty = requested.get(id);
    if (
      requestedQty !== undefined &&
      requestedQty > endingStock + (restored.get(id) ?? 0)
    ) {
      throw new AppError(
        `Jumlah retur melebihi stok tersedia pada stok ${id}`,
        400,
      );
    }
  }
}

async function lockExistingReturnOrder(
  returnId: number,
  paidError: string,
  tx: Tx,
) {
  const [snapshot] = await purchaseReturnRepository.getById(returnId, tx);
  if (!snapshot) {
    throw new AppError("Data retur pembelian tidak ditemukan", 404);
  }
  const order = await purchaseOrderRepository.getById(
    snapshot.purchase_order_id,
    tx,
  );
  if (!order) throw new AppError("Invoice not found", 404);

  // Another transaction may have replaced or deleted the return while we waited.
  const [current] = await purchaseReturnRepository.getById(returnId, tx);
  if (!current || current.purchase_order_id !== order.id) {
    throw new AppError("Data retur pembelian tidak ditemukan", 404);
  }
  if (order.paid_amount !== 0) throw new AppError(paidError, 400);
  if (current.client_id !== order.client_id) {
    throw new AppError("Nota tidak terkait dengan klien pada retur", 400);
  }
  return order;
}

async function restoreReturn(
  returnId: number,
  oldLines: ReturnLine[],
  oldStocks: Map<number, number>,
  tx: Tx,
) {
  await purchaseOrderLineRepository.bulkIncrementQuantity(
    oldLines.map((line) => ({
      id: line.purchase_order_line_id,
      quantity: line.return_qty,
    })),
    tx,
  );
  if (oldStocks.size > 0) {
    await stockRepository.bulkIncrementStockAndDecrementQtyOut(
      stockUpdates(oldStocks),
      tx,
    );
  }
  await purchaseReturnLineRepository.deleteByPurchaseReturnIds([returnId], tx);
  await purchaseReturnRepository.deleteById(returnId, tx);
}

async function applyReturn(
  data: InsertPurchaseReturn,
  lines: ValidatedReturnLine[],
  stocks: Map<number, number>,
  insertError: string,
  tx: Tx,
) {
  const [insertedReturn] = await purchaseReturnRepository.createPurchaseReturn(
    data,
    tx,
  );
  if (!insertedReturn) throw new AppError(insertError, 500);
  await purchaseReturnLineRepository.createPurchaseReturnLine(
    lines,
    insertedReturn.id,
    tx,
  );
  await purchaseOrderLineRepository.bulkDecrementQuantity(
    lines.map((line) => ({
      id: line.purchase_order_line_id,
      quantity: line.return_qty,
    })),
    tx,
  );
  if (stocks.size > 0) {
    await stockRepository.bulkDecrementStockAndIncrementQtyOut(
      stockUpdates(stocks),
      tx,
    );
  }
}

async function recalculateInvoice(order: InvoiceTotals, tx: Tx) {
  const discount = await purchaseOrderRepository.getDiscountById(order.id, tx);
  const rawTotal = await purchaseOrderLineRepository.getSumTotalPriceByOrderId(
    order.id,
    tx,
  );
  const total = Math.floor(rawTotal * (1 - discount / 100));
  await purchaseOrderRepository.updateInvoiceValue(total, order.id, tx);
  await clientRepository.incPayableBalance(
    order.client_id,
    total - order.invoice_value,
    tx,
  );
}

export const purchaseReturnService = {
  createPurchaseReturn(data: InsertPurchaseReturn) {
    return db.transaction(async (tx) => {
      const order = await purchaseOrderRepository.getById(
        data.purchase_order_id,
        tx,
      );
      if (!order) throw new AppError("Invoice not found", 404);
      if (order.client_id !== data.client_id) {
        throw new AppError("Nota tidak terkait dengan klien yang dipilih", 400);
      }
      if (order.paid_amount !== 0) {
        throw new AppError(
          "Retur tidak bisa dibuat karena nota sudah dibayar",
          400,
        );
      }

      const lines = await getValidatedLines(order.id, data.lines, [], tx);
      const stocks = stockQuantities(lines);
      await lockReturnStocks(stocks, new Map(), tx);
      await applyReturn(
        data,
        lines,
        stocks,
        "Failed to create purchase return",
        tx,
      );
      await recalculateInvoice(order, tx);
    });
  },

  getUnpaidReturnedInvoices() {
    return purchaseReturnRepository.getUnpaidReturnedInvoices();
  },

  async getEditPurchaseReturnDetail(returnId: number) {
    const data =
      await purchaseReturnRepository.getEditPurchaseReturnDetailById(returnId);

    if (!data) {
      throw new AppError("Data retur tidak ditemukan", 404);
    }

    return data;
  },

  updatePurchaseReturn(data: UpdatePurchaseReturn) {
    return db.transaction(async (tx) => {
      const returnId = data.purchase_return_id;
      const order = await lockExistingReturnOrder(
        returnId,
        "Retur tidak bisa diedit karena nota sudah dibayar",
        tx,
      );
      const oldLines =
        await purchaseReturnLineRepository.getByPurchaseReturnIds(
          [returnId],
          tx,
        );
      const oldStocks = stockQuantities(oldLines);
      // Check availability as it will be after restoring this return.
      const lines = await getValidatedLines(order.id, data.lines, oldLines, tx);
      const stocks = stockQuantities(lines);
      await lockReturnStocks(stocks, oldStocks, tx);
      await restoreReturn(returnId, oldLines, oldStocks, tx);
      if (lines.length > 0) {
        await applyReturn(
          {
            client_id: order.client_id,
            purchase_order_id: order.id,
            return_date: data.return_date,
            lines,
          },
          lines,
          stocks,
          "Failed to update purchase return",
          tx,
        );
      }
      await recalculateInvoice(order, tx);
      return {
        message:
          lines.length > 0
            ? "Purchase return updated successfully"
            : "Dokumen retur pembelian berhasil dibatalkan karena semua jumlah retur di-nol-kan",
      };
    });
  },

  getReturnHistory(purchaseOrderId: number) {
    return purchaseReturnRepository.getReturnHistoryByPurchaseOrderId(
      purchaseOrderId,
    );
  },

  deletePurchaseReturn(returnId: number) {
    return db.transaction(async (tx) => {
      const order = await lockExistingReturnOrder(
        returnId,
        "Retur tidak bisa dihapus karena nota sudah ada pembayaran",
        tx,
      );
      const oldLines =
        await purchaseReturnLineRepository.getByPurchaseReturnIds(
          [returnId],
          tx,
        );
      await getValidatedLines(order.id, [], oldLines, tx);
      const oldStocks = stockQuantities(oldLines);
      await lockReturnStocks(new Map(), oldStocks, tx);
      await restoreReturn(returnId, oldLines, oldStocks, tx);
      await recalculateInvoice(order, tx);
      return { message: "Retur pembelian berhasil dihapus" };
    });
  },
};
