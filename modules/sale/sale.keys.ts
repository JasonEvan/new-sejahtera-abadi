export const getOrdersMenuKey = (clientId: number, isPaidOff: boolean) =>
  ["sale-orders-menu", { clientId, isPaidOff }] as const;
export const invalidateOrdersMenuKey = () => ["sale-orders-menu"] as const;
