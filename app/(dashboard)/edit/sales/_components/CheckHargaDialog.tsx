"use client";

import InputField from "@/components/shared/InputField";
import { useGetSoldItemHistoryByClient } from "@/modules/sale/sale.queries";
import dayjs from "dayjs";
import { FormProvider, useForm, useWatch } from "react-hook-form";

type CheckHargaFormField = {
  name: string;
};

export default function CheckHargaDialog({
  clientId,
  salesOrderId,
}: {
  clientId: number;
  salesOrderId: number;
}) {
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

  const { data: soldItems, isFetching } = useGetSoldItemHistoryByClient(
    clientId,
    normalizedName,
    !!normalizedName,
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
            soldItems?.map((item) => (
              <div
                key={item.sales_order_line_id}
                className="rounded-md border p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    {item.name} - {item.price.toLocaleString("id-ID")}
                  </p>
                  {item.sales_order_id === salesOrderId && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Nota aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Nota {item.invoice_number} ·{" "}
                  {dayjs(item.sold_at).format("DD/MM/YYYY HH:mm")}
                </p>
              </div>
            ))}
        </div>
      </div>
    </FormProvider>
  );
}
