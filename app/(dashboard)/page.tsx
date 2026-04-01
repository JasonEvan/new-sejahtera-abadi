import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  Boxes,
  CircleDollarSign,
  Download,
  FileClock,
  PackageCheck,
  ShoppingCart,
  Store,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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

const headlineStats = [
  {
    label: "Today Revenue",
    value: 24875000,
    unit: "IDR",
    growth: "+12.4%",
    icon: CircleDollarSign,
  },
  {
    label: "Gross Profit",
    value: 7310000,
    unit: "IDR",
    growth: "+7.8%",
    icon: TrendingUp,
  },
  {
    label: "Open Receivables",
    value: 12890000,
    unit: "IDR",
    growth: "-2.1%",
    icon: Banknote,
  },
  {
    label: "Active Clients",
    value: 183,
    unit: "accounts",
    growth: "+4 new",
    icon: Store,
  },
] as const;

const operationalStats = [
  { label: "Sales Orders", value: 42, helper: "Today" },
  { label: "Purchase Orders", value: 16, helper: "Today" },
  { label: "Low Stock Alerts", value: 9, helper: "Need refill" },
  { label: "Paid Invoices", value: 31, helper: "This week" },
  { label: "Pending Deliveries", value: 7, helper: "Due soon" },
  { label: "Return Requests", value: 3, helper: "Open" },
] as const;

const recentActivity = [
  {
    title: "Invoice SO-2401 paid",
    subtitle: "PT Maju Sentosa - IDR 1,850,000",
    time: "12 min ago",
  },
  {
    title: "Purchase PO-1132 created",
    subtitle: "CV Sumber Pangan - 18 items",
    time: "45 min ago",
  },
  {
    title: "Stock adjustment approved",
    subtitle: "Gudang Utama - 6 SKU corrected",
    time: "1 hr ago",
  },
  {
    title: "Export completed",
    subtitle: "stocks_2026-04-01.csv",
    time: "2 hr ago",
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

export default function Home() {
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
                <Link href="/view">View Transactions</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in slide-in-from-right-1 duration-500">
            {headlineStats.map((item) => {
              const Icon = item.icon;

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
                  <p className="text-lg font-black tracking-tight">
                    {item.unit === "IDR"
                      ? formatCompactIdr(item.value)
                      : new Intl.NumberFormat("id-ID").format(item.value)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.growth} vs yesterday
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

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
            {operationalStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border bg-background p-3"
              >
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-black leading-none tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.helper}
                </p>
              </div>
            ))}
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
            {recentActivity.map((activity) => (
              <li
                key={activity.title}
                className="rounded-lg border bg-background p-3"
              >
                <p className="text-sm font-semibold tracking-tight">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.subtitle}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  {activity.time}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
