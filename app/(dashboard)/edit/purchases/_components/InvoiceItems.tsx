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
      </div>
      <AddItemForm />
      <DataTable columns={columns} data={sortedItems} maxHeight="500px" />
    </div>
  );
}
