import { useQuery } from "@tanstack/react-query";
import { getEditPayablesByInvoice } from "./purchase-payment.api";
import { getEditPayablesByInvoiceKey } from "./purchase-payment.keys";

export const useGetEditPayablesByInvoice = (
  invoiceNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getEditPayablesByInvoiceKey(invoiceNumber),
    queryFn: () => getEditPayablesByInvoice(invoiceNumber),
    select: (data) => data.data,
    enabled,
  });
};
