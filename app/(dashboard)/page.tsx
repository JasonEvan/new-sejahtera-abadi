"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Boxes,
  CircleDollarSign,
  Download,
  FileClock,
  PackageCheck,
  RefreshCcw,
  ShoppingCart,
  Store,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDashboardSnapshot } from "@/modules/report/report.queries";
import { DashboardSnapshot } from "@/modules/report/report.types";

const quickActions = [
  {
    title: "New Sale",
    description: "Create sales order and print invoice.",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    title: "New Purchase",
    description: "Record supplier purchase quickly.",
    href: "/purchases",
    icon: PackageCheck,
  },
  {
    title: "Manage Stock",
    description: "Review stock level and unit cost.",
    href: "/stocks",
    icon: Boxes,
  },
  {
    title: "Clients",
    description: "Open customer list and balances.",
    href: "/clients",
    icon: UserRound,
  },
  {
    title: "Export Data",
    description: "Download operational CSV data.",
    href: "/export",
    icon: Download,
  },
  {
    title: "Backup",
    description: "Create or restore system backup.",
    href: "/backup",
    icon: FileClock,
  },
] as const;

const headlineStatsConfig = [
  {
    key: "todayRevenue",
    label: "Today Revenue",
    unit: "IDR",
    icon: CircleDollarSign,
  },
  {
    key: "grossProfit",
    label: "Gross Profit",
    unit: "IDR",
    icon: TrendingUp,
  },
  {
    key: "openReceivables",
    label: "Open Receivables",
    unit: "IDR",
    icon: Banknote,
  },
  {
    key: "activeClients",
    label: "Active Clients (30d)",
    unit: "accounts",
    icon: Store,
  },
] as const;

const operationalStatsConfig = [
  {
    key: "salesOrdersToday",
    label: "Sales Orders",
    helper: "Today",
  },
  {
    key: "purchaseOrdersToday",
    label: "Purchase Orders",
    helper: "Today",
  },
  {
    key: "lowStockAlerts",
    label: "Low Stock Alerts",
    helper: "Ending stock <= 5",
  },
  {
    key: "paidInvoicesThisWeek",
    label: "Paid Invoices",
    helper: "This week",
  },
  {
    key: "pendingReceivables",
    label: "Pending Receivables",
    helper: "Open invoices",
  },
  {
    key: "returnRequestsThisMonth",
    label: "Return Requests",
    helper: "This month",
  },
] as const;

function formatCompactIdr(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDeltaPercentage(delta: number | null) {
  if (delta === null) {
    return "No previous baseline";
  }

  if (delta === 0) {
    return "0.0% vs previous period";
  }

  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${delta.toFixed(1)}% vs previous period`;
}

function formatRelativeTime(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day ago`;
}

export default function Home() {
  const { data, isLoading, isFetching, isError, refetch } =
    useGetDashboardSnapshot();

  const snapshot = data as DashboardSnapshot | undefined;
  const showSkeleton = isLoading && !snapshot;

  return (
    <div className="relative space-y-6 pb-4">
      <div className="pointer-events-none absolute inset-x-0 -top-6 -z-10 h-44 rounded-3xl bg-linear-to-r from-orange-200/45 via-amber-100/20 to-lime-200/35 blur-3xl" />

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid gap-5 bg-linear-to-br from-orange-50 via-background to-amber-50 p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr] lg:p-7">
          <div className="space-y-3 animate-in fade-in slide-in-from-left-1 duration-500">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Business Overview
            </p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Dashboard Home
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Track your business pulse in one place, jump into daily workflows,
              and monitor key numbers without loading heavy charts.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button asChild className="cursor-pointer">
                <Link href="/sales">
                  Go To Sales
                  <ArrowUpRight />
                </Link>
              </Button>
              <Button asChild variant="outline" className="cursor-pointer">
                <Link href="/view/all-receivables">View Transactions</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in slide-in-from-right-1 duration-500">
            {headlineStatsConfig.map((item) => {
              const Icon = item.icon;
              const stat = snapshot?.headline[item.key];

              return (
                <article
                  key={item.label}
                  className="rounded-xl border bg-background/80 p-4 backdrop-blur"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      {item.label}
                    </p>
                    <div className="rounded-md bg-orange-100 p-1.5 text-orange-700">
                      <Icon className="size-4" />
                    </div>
                  </div>

                  {showSkeleton ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-black tracking-tight">
                        {typeof stat?.value === "number"
                          ? item.unit === "IDR"
                            ? formatCompactIdr(stat.value)
                            : new Intl.NumberFormat("id-ID").format(stat.value)
                          : "--"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDeltaPercentage(stat?.deltaPercentage ?? null)}
                      </p>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 text-destructive" />
              <div>
                <p className="text-sm font-semibold">
                  Dashboard data unavailable
                </p>
                <p className="text-sm text-muted-foreground">
                  Some sections could not load from backend endpoints.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="cursor-pointer"
            >
              <RefreshCcw className={isFetching ? "animate-spin" : ""} />
              Retry
            </Button>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Quick Actions</h2>
          <p className="text-xs text-muted-foreground">6 shortcuts</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm animate-in fade-in slide-in-from-bottom-1"
                style={{
                  animationDuration: "550ms",
                  animationDelay: `${index * 80}ms`,
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-lg border bg-secondary/60 p-2 text-foreground">
                    <Icon className="size-4" />
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                </div>

                <h3 className="font-semibold tracking-tight">{action.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">
              Operational Numbers
            </h2>
            <p className="text-xs text-muted-foreground">Live snapshot</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {operationalStatsConfig.map((stat) => {
              const value = snapshot?.operational[stat.key];

              return (
                <div
                  key={stat.label}
                  className="rounded-lg border bg-background p-3"
                >
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  {showSkeleton ? (
                    <Skeleton className="mt-2 h-7 w-16" />
                  ) : (
                    <p className="mt-1 text-2xl font-black leading-none tracking-tight">
                      {typeof value === "number" ? value : "--"}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.helper}
                  </p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">
              Recent Activity
            </h2>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="cursor-pointer"
            >
              <Link href="/view">Open All</Link>
            </Button>
          </div>

          <ul className="space-y-2.5">
            {showSkeleton &&
              Array.from({ length: 4 }).map((_, index) => (
                <li
                  key={`activity-skeleton-${index}`}
                  className="rounded-lg border bg-background p-3"
                >
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-56" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </li>
              ))}

            {!showSkeleton &&
              (snapshot?.recentActivity.length ? (
                snapshot.recentActivity.map((activity) => (
                  <li
                    key={`${activity.title}-${activity.occurredAt}`}
                    className="rounded-lg border bg-background p-3"
                  >
                    <p className="text-sm font-semibold tracking-tight">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.subtitle}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                      {formatRelativeTime(activity.occurredAt)}
                    </p>
                  </li>
                ))
              ) : (
                <li className="rounded-lg border bg-background p-3">
                  <p className="text-sm font-semibold tracking-tight">
                    No activity found
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Transactions will appear here once available.
                  </p>
                </li>
              ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
