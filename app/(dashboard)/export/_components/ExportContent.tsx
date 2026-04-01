"use client";

import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const stockColumnOptions = [
  { key: "name", label: "nama" },
  { key: "initial_stock", label: "stock_awal" },
  { key: "ending_stock", label: "stock_akhir" },
  { key: "product_price", label: "harga_barang" },
  { key: "qty_in", label: "qty_in" },
  { key: "qty_out", label: "qty_out" },
  { key: "selling_price", label: "harga_jual" },
  { key: "unit", label: "satuan" },
  { key: "capital_cost", label: "modal" },
] as const;

type StockColumnKey = (typeof stockColumnOptions)[number]["key"];

type ExportTab = "stock";

export default function ExportContent() {
  const [activeTab, setActiveTab] = useState<ExportTab>("stock");
  const [selectedColumns, setSelectedColumns] = useState<StockColumnKey[]>([
    "name",
    "initial_stock",
    "ending_stock",
  ]);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredOptions = useMemo(() => {
    const lowered = searchText.toLowerCase();
    return stockColumnOptions.filter((option) =>
      option.label.toLowerCase().includes(lowered),
    );
  }, [searchText]);

  const selectedLabels = useMemo(() => {
    if (selectedColumns.length === 0) {
      return "Pilih kolom";
    }

    const labels = stockColumnOptions
      .filter((option) => selectedColumns.includes(option.key))
      .map((option) => option.label);

    return labels.join(", ");
  }, [selectedColumns]);

  function toggleColumn(column: StockColumnKey) {
    setSelectedColumns((previous) => {
      if (previous.includes(column)) {
        return previous.filter((item) => item !== column);
      }

      return [...previous, column];
    });
  }

  async function handleExportStockCsv() {
    if (selectedColumns.length === 0) {
      toast.error("Pilih minimal satu kolom untuk export", {
        position: "bottom-right",
      });
      return;
    }

    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      selectedColumns.forEach((column) => params.append("columns", column));

      const response = await fetch(`/api/export/stocks?${params.toString()}`);

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(errorPayload?.error || "Gagal export stock");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const matchedFileName = disposition.match(/filename="?([^\"]+)"?/i)?.[1];
      const filename = matchedFileName || "stock-export.csv";

      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);

      toast.success("Export stock berhasil", { position: "bottom-right" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Export gagal";
      toast.error(message, { position: "bottom-right" });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`px-4 py-2 text-sm font-medium border-b-2 cursor-pointer transition-colors ${
            activeTab === "stock"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Stock
        </button>
      </div>

      {activeTab === "stock" && (
        <section className="rounded-lg border p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Kolom</label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsComboboxOpen((previous) => !previous)}
                className="w-full min-h-10 rounded-md border px-3 py-2 text-left text-sm bg-background"
              >
                <span className="block truncate">{selectedLabels}</span>
              </button>

              {isComboboxOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-md border bg-background p-2 shadow-md space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <input
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Cari kolom..."
                      className="h-9 w-full rounded-md border pl-8 pr-2 text-sm"
                    />
                  </div>

                  <div className="max-h-56 overflow-auto space-y-1">
                    {filteredOptions.map((option) => {
                      const checked = selectedColumns.includes(option.key);

                      return (
                        <label
                          key={option.key}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleColumn(option.key)}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}

                    {filteredOptions.length === 0 && (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        Kolom tidak ditemukan
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleExportStockCsv}
            disabled={isExporting}
            className="cursor-pointer"
          >
            <Download />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </section>
      )}
    </div>
  );
}
