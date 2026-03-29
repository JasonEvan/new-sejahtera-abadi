import { useQuery } from "@tanstack/react-query";
import { getEditReceivablesByInvoice } from "./sales-payment.api";
import { getEditReceivablesByInvoiceKey } from "./sales-payment.keys";

export const useGetEditReceivablesByInvoice = (
  invoiceNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getEditReceivablesByInvoiceKey(invoiceNumber),
    queryFn: () => getEditReceivablesByInvoice(invoiceNumber),
    select: (data) => data.data,
    enabled,
  });
};
