"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCompanySettings } from "@/modules/company/company.queries";
import { useUpdateCompanySettings } from "@/modules/company/company.mutations";
import {
  companySchema,
  CompanyFormValues,
} from "@/modules/company/company.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export default function CompanySettingsForm() {
  const { data: settings, isLoading } = useCompanySettings();
  const updateSettingsMutation = useUpdateCompanySettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      address: "",
      timezone: "Asia/Jakarta",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        address: settings.address,
        timezone: settings.timezone,
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: CompanyFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="rounded-3xl shadow-xl shadow-primary/5 ring-1 ring-border/50">
      <CardHeader>
        <CardTitle>Detail Perusahaan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Field>
            <FieldLabel>Nama Perusahaan</FieldLabel>
            <Input
              {...register("name")}
              placeholder="Masukkan nama perusahaan"
              className="h-12 rounded-xl"
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Alamat Perusahaan</FieldLabel>
            <Textarea
              {...register("address")}
              placeholder="Masukkan alamat lengkap perusahaan"
              className="min-h-[120px] rounded-xl resize-none"
            />
            {errors.address && (
              <FieldError>{errors.address.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Zona Waktu</FieldLabel>
            <select
              {...register("timezone")}
              className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:ring-primary/20"
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
            </select>
            {errors.timezone && (
              <FieldError>{errors.timezone.message}</FieldError>
            )}
          </Field>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
