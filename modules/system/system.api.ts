import api from "@/lib/axios";

export async function performCutoff(data: { endDate: string }) {
  const response = await api.post<{ message: string }>("/cutoff", data);
  return response.data;
}

export async function getCutoffSummary(endDate: string) {
  const response = await api.get<{
    unpaidSales: {
      count: number;
      totalBalanceDue: number;
      items: { invoice_number: string; balance_due: number }[];
    };
    unpaidPurchases: {
      count: number;
      totalBalanceDue: number;
      items: { invoice_number: string; balance_due: number }[];
    };
  }>("/cutoff/summary", { params: { endDate } });
  return response.data;
}
