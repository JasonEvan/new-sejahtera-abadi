"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { useEditSaleStore } from "@/stores/transactions/useEditSaleStore";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import AddItemForm from "./AddItemForm";
import CheckHargaDialog from "./CheckHargaDialog";
import { useColumns } from "./columns";

export default function InvoiceItems() {
  const columns = useColumns();
  const items = useEditSaleStore((state) => state.items);
  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const invoiceInformation = useEditSaleStore(
    (state) => state.invoice_information,
  );

  const handleCheckPrice = useCallback(() => {
    if (!invoiceInformation.client) {
      toast.error("Pilih client dan nota terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }

    dialogs.open({
      title: "Check Harga",
      description: "Cari harga jual terakhir per barang untuk client ini",
      type: "text",
      size: "tall",
      children: <CheckHargaDialog clientId={invoiceInformation.client} />,
    });
  }, [invoiceInformation.client]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F1") return;

      event.preventDefault();
      if (event.repeat) return;

      handleCheckPrice();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCheckPrice]);

  return (
    <div className="mt-5 space-y-5">
      <div className="flex justify-end gap-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCheckPrice}
          aria-keyshortcuts="F1"
        >
          Check Harga (F1)
        </Button>
      </div>
      <AddItemForm />
      <DataTable columns={columns} data={sortedItems} maxHeight="500px" />
    </div>
  );
}
