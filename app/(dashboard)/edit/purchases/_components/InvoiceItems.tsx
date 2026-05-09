"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { useEditPurchaseStore } from "@/stores/transactions/useEditPurchaseStore";
import { toast } from "sonner";
import AddItemForm from "./AddItemForm";
import CheckHargaDialog from "./CheckHargaDialog";
import { useColumns } from "./columns";

export default function InvoiceItems() {
  const columns = useColumns();
  const items = useEditPurchaseStore((state) => state.items);
  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const invoiceInformation = useEditPurchaseStore(
    (state) => state.invoice_information,
  );

  const handleAddItem = () => {
    dialogs.open({
      title: "Tambah Item",
      description: "Tambahkan item untuk nota",
      type: "form",
      formId: "add-edit-purchase-item-form",
      children: <AddItemForm />,
    });
  };

  const handleCheckPrice = () => {
    if (!invoiceInformation.client) {
      toast.error("Pilih client dan nota terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }

    dialogs.open({
      title: "Check Harga",
      description: "Cari harga beli terakhir per barang untuk client ini",
      type: "text",
      children: <CheckHargaDialog clientId={invoiceInformation.client} />,
    });
  };

  return (
    <div className="mt-5 space-y-5">
      <div className="flex justify-end gap-x-3">
        <Button type="button" variant="outline" onClick={handleCheckPrice}>
          Check Harga
        </Button>
        <Button type="button" onClick={handleAddItem}>
          Add
        </Button>
      </div>
      <DataTable columns={columns} data={sortedItems} maxHeight="500px" />
    </div>
  );
}
