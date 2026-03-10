import { useQuery } from "@tanstack/react-query";
import { getOrdersMenuKey } from "./purchase.keys";
import { getOrdersMenu } from "./purchase.api";

export const useGetOrdersMenu = ({
  clientId,
  isPaidOff,
}: {
  clientId: number;
  isPaidOff: boolean;
}) => {
  return useQuery({
    queryKey: getOrdersMenuKey(clientId, isPaidOff),
    queryFn: () => getOrdersMenu(clientId, isPaidOff),
    select: (data) =>
      data.data.map((invoice) => ({
        id: invoice.id,
        name: invoice.invoice_number,
        balance_due: invoice.balance_due,
      })),
  });
};
