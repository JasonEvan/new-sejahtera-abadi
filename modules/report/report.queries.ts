import { useQuery } from "@tanstack/react-query";
import {
  getAllPayablesKey,
  getAllReceivablesKey,
  getDashboardSnapshotKey,
  getInventoryLedgersKey,
  getPayablesByClientKey,
  getProfitReportKey,
  getReceivablesByClientKey,
  getAssetValueKey,
} from "./report.keys";
import {
  getAllPayables,
  getAllReceivables,
  getDashboardSnapshot,
  getInventoryLedgers,
  getPayablesByClient,
  getProfitReport,
  getReceivablesByClient,
  getAssetValues,
} from "./report.api";

export const useGetInventoryLedgers = (stockId: number, enabled: boolean) => {
  return useQuery({
    queryKey: getInventoryLedgersKey(stockId),
    queryFn: () => getInventoryLedgers(stockId),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetAllPayables = () => {
  return useQuery({
    queryKey: getAllPayablesKey(),
    queryFn: getAllPayables,
    select: (data) => data.data,
  });
};

export const useGetAllReceivables = () => {
  return useQuery({
    queryKey: getAllReceivablesKey(),
    queryFn: getAllReceivables,
    select: (data) => data.data,
  });
};

export const useGetPayablesByClient = (clientId: number, enabled: boolean) => {
  return useQuery({
    queryKey: getPayablesByClientKey(clientId),
    queryFn: () => getPayablesByClient(clientId),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetReceivablesByClient = (
  clientId: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getReceivablesByClientKey(clientId),
    queryFn: () => getReceivablesByClient(clientId),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetProfitReport = (
  month: number,
  year: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getProfitReportKey(month, year),
    queryFn: () => getProfitReport(month, year),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetDashboardSnapshot = () => {
  return useQuery({
    queryKey: getDashboardSnapshotKey(),
    queryFn: getDashboardSnapshot,
    select: (data) => data.data,
    staleTime: 60_000,
  });
};

export const useGetAssetValues = () => {
  return useQuery({
    queryKey: getAssetValueKey(),
    queryFn: getAssetValues,
    select: (data) => data.data,
  });
};
