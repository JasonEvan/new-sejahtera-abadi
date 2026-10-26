"use client";

import InputField from "@/components/shared/InputField";
import { useGetLatestSoldItemsByClient } from "@/modules/sale/sale.queries";
import { useEditSaleStore } from "@/stores/transactions/useEditSaleStore";
import dayjs from "dayjs";
import { useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

type CheckHargaFormField = {
  name: string;
};

export default function CheckHargaDialog({ clientId }: { clientId: number }) {
  const invoiceItems = useEditSaleStore((state) => state.items);
  const invoiceItemNames = useMemo(
    () => new Set(invoiceItems.map((item) => item.name)),
    [invoiceItems],
  );

  const methods = useForm<CheckHargaFormField>({
    defaultValues: {
      name: "",
    },
  });

  const { control } = methods;

  const watchedName = useWatch({
    control,
    name: "name",
  });

  const normalizedName = (watchedName || "").trim();

  const { data: soldItems, isFetching } = useGetLatestSoldItemsByClient(
    clientId,
    normalizedName,
    !!normalizedName,
  );

  const sortedItems = useMemo(
    () =>
      [...(soldItems ?? [])].sort(
        (a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime(),
      ),
    [soldItems],
  );

  return (
    <FormProvider {...methods}>
      <div className="space-y-3">
        <InputField
          name="name"
          label="Nama Barang"
          placeholder="Ketik nama barang"
        />

        <div className="space-y-2">
          {isFetching && (
            <p className="text-sm text-muted-foreground">Mencari barang...</p>
          )}

          {!isFetching && !normalizedName && (
            <p className="text-sm text-muted-foreground">
              Ketik nama barang untuk mencari riwayat harga.
            </p>
          )}

          {!isFetching && !!normalizedName && soldItems?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Barang tidak ditemukan.
            </p>
          )}

          {!isFetching &&
            sortedItems.map((item) => (
              <div key={item.name} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    {item.name} - {item.price.toLocaleString("id-ID")}
                  </p>
                  {invoiceItemNames.has(item.name) && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Ada di nota aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dayjs(item.sold_at).format("DD/MM/YYYY HH:mm")}
                </p>
              </div>
            ))}
        </div>
      </div>
    </FormProvider>
  );
}
