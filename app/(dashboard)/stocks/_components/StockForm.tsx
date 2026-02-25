"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  useAddStockMutation,
  useEditStockMutation,
} from "@/modules/stock/stock.mutations";
import { InsertStock, Stock } from "@/modules/stock/stock.types";
import { addStockValidation } from "@/modules/stock/stock.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export default function StockForm({ stock }: { stock?: Stock }) {
  const addStockMutation = useAddStockMutation();
  const editStockMutation = useEditStockMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InsertStock>({
    defaultValues: {
      name: stock?.name || "",
      unit: stock?.unit || "",
      initial_stock: stock?.initial_stock ?? undefined,
      capital_cost: stock?.capital_cost ?? undefined,
      product_price: stock?.product_price ?? undefined,
      selling_price: stock?.selling_price ?? undefined,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(addStockValidation),
  });

  const onSubmit = (data: InsertStock) => {
    if (stock) {
      editStockMutation.mutate({ id: stock.id, data });
    } else {
      addStockMutation.mutate(data);
    }
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
