"use client";

import ComboboxField from "@/components/shared/ComboboxField";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGetClientNames } from "@/modules/client/client.queries";
import { useGetPayablesByClient } from "@/modules/report/report.queries";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { columns } from "./columns";

export default function PayablesPerClientContent() {
  const [clientId, setClientId] = useState(0);
  const {
    data: payables,
    isLoading,
    isError: isResultError,
    error: resultError,
  } = useGetPayablesByClient(clientId, !!clientId);
  const { data: clientNames, isError, error } = useGetClientNames();

  const methods = useForm<{ client_id: number }>({
    defaultValues: {
      client_id: 0,
    },
  });

  const onSubmit = (data: { client_id: number }) => {
    setClientId(data.client_id);
  };

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Gagal memuat data nama client", {
        position: "bottom-right",
      });
    }
  }, [isError, error]);

  useEffect(() => {
    if (isResultError) {
      toast.error(resultError.message || "Gagal memuat data utang client", {
        position: "bottom-right",
      });
    }
  }, [isResultError, resultError]);

  return (
    <div className="flex flex-col gap-y-3 mt-3">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3">
          <div className="w-1/3">
            <ComboboxField
              name="client_id"
              label="Nama Client"
              items={clientNames || []}
            />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </FormProvider>
      {isLoading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <DataTable data={payables || []} columns={columns} maxHeight="500px" />
      )}
    </div>
  );
}
