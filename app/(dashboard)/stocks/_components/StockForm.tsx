"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAddStockMutation } from "@/modules/stock/stock.mutations";
import { addStockValidation } from "@/modules/stock/stock.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

type StockFormField = z.infer<typeof addStockValidation>;

export default function StockForm() {
  const addStockMutation = useAddStockMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StockFormField>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(addStockValidation),
  });

  const onSubmit = (data: StockFormField) => {
    addStockMutation.mutate(data);
  };

  return (
    <form
      id="add-stock-form"
      className="space-y-3"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-2 gap-x-2">
        <Field>
          <FieldLabel>Nama Barang</FieldLabel>
          <Input {...register("name")} placeholder="Amplas" />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel>Satuan</FieldLabel>
          <Input {...register("unit")} placeholder="Pcs" />
          {errors.unit && <FieldError>{errors.unit.message}</FieldError>}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        <Field>
          <FieldLabel>Stock Awal</FieldLabel>
          <Input
            type="number"
            {...register("initial_stock", { valueAsNumber: true })}
          />
          {errors.initial_stock && (
            <FieldError>{errors.initial_stock.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel>Modal</FieldLabel>
          <Input
            type="number"
            {...register("capital_cost", { valueAsNumber: true })}
          />
          {errors.capital_cost && (
            <FieldError>{errors.capital_cost.message}</FieldError>
          )}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        <Field>
          <FieldLabel>Harga Beli</FieldLabel>
          <Input
            type="number"
            {...register("product_price", { valueAsNumber: true })}
          />
          {errors.product_price && (
            <FieldError>{errors.product_price.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel>Harga Jual</FieldLabel>
          <Input
            type="number"
            {...register("selling_price", {
              setValueAs: (v) => (v === "" ? undefined : Number(v)),
            })}
          />
          {errors.selling_price && (
            <FieldError>{errors.selling_price.message}</FieldError>
          )}
        </Field>
      </div>
    </form>
  );
}
