export const getOrdersMenuKey = (clientId: number, isPaidOff: boolean) =>
  ["purchase-orders-menu", { clientId, isPaidOff }] as const;
export const invalidateOrdersMenuKey = () => ["purchase-orders-menu"] as const;
