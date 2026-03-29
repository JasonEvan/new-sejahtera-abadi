"use client";

import InputField from "@/components/shared/InputField";
import { useGetLatestSoldItemsByClient } from "@/modules/sale/sale.queries";
import dayjs from "dayjs";
import { FormProvider, useForm, useWatch } from "react-hook-form";

type CheckHargaFormField = {
  name: string;
};

export default function CheckHargaDialog({ clientId }: { clientId: number }) {
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
            (soldItems || []).map((item) => (
              <div key={item.name} className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  {item.name} - {item.price.toLocaleString("id-ID")}
                </p>
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
