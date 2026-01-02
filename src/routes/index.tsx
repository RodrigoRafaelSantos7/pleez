import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "#convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useState, Suspense } from "react";
import { Filters, type FiltersState } from "~/components/dashboard/Filters";
import { CategorySection } from "~/components/dashboard/CategorySection";
import { PromoImpactPanel } from "~/components/dashboard/PromoImpactPanel";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Hamburger,
  CurrencyEur,
  TrendUp,
  ShoppingCart,
  Percent,
} from "@phosphor-icons/react";

export const Route = createFileRoute("/")({ component: Dashboard });

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function Dashboard() {
  const [filters, setFilters] = useState<FiltersState>({
    startDate: undefined,
    endDate: undefined,
    platform: "all",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Hamburger weight="bold" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">BurgerBytes</h1>
              <p className="text-sm text-muted-foreground">Menu Intelligence Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <Filters filters={filters} onFiltersChange={setFilters} />
          </CardContent>
        </Card>

        {/* Dashboard Content */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent filters={filters} />
        </Suspense>
      </main>
    </div>
  );
}

function DashboardContent({ filters }: { filters: FiltersState }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.analytics.getMenuAnalytics, {
      startDate: filters.startDate,
      endDate: filters.endDate,
      platform: filters.platform === "all" ? undefined : filters.platform,
    })
  );

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-chart-1/10 p-2">
                <CurrencyEur weight="duotone" className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">
                  List revenue: {formatCurrency(data.summary.totalListRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <TrendUp weight="duotone" className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(data.summary.totalProfit)}</p>
                <p className="text-xs text-muted-foreground">After cost deductions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-chart-3/10 p-2">
                <ShoppingCart weight="duotone" className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{formatNumber(data.summary.totalOrders)}</p>
                <p className="text-xs text-muted-foreground">Completed transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-chart-2/10 p-2">
                <Percent weight="duotone" className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Margin</p>
                <p className="text-2xl font-bold">{data.summary.avgMargin}%</p>
                <p className="text-xs text-muted-foreground">Profit per item</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Hamburger weight="duotone" className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orders with Promos</p>
                <p className="text-2xl font-bold">{data.summary.promoOrdersPercent}%</p>
                <p className="text-xs text-muted-foreground">Discounted orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Impact Analysis */}
      <PromoImpactPanel promoImpact={data.promoImpact} />

      {/* Recommendation Categories */}
      <div className="space-y-8">
        <CategorySection category="promote" items={data.promote} />
        <CategorySection category="price_optimize" items={data.priceOptimize} />
        <CategorySection category="rename_remove" items={data.renameRemove} />
        <CategorySection category="maintain" items={data.maintain} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Summary Stats Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted" />
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-6 w-24 rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promo Panel Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-5 w-48 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Sections Skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-20 rounded-xl bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-48 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
