import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { ChartConfig } from "~/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import { Lightning, ShoppingCart, Receipt, TrendDown } from "@phosphor-icons/react";

type PromoImpactPanelProps = {
  promoImpact: {
    promoRevenue: number;
    nonPromoRevenue: number;
    promoOrderCount: number;
    nonPromoOrderCount: number;
    promoAvgOrderValue: number;
    nonPromoAvgOrderValue: number;
  };
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

const chartConfig = {
  promo: {
    label: "Promo Orders",
    color: "var(--chart-2)",
  },
  nonPromo: {
    label: "Regular Orders",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function PromoImpactPanel({ promoImpact }: PromoImpactPanelProps) {
  const totalRevenue = promoImpact.promoRevenue + promoImpact.nonPromoRevenue;
  const totalOrders = promoImpact.promoOrderCount + promoImpact.nonPromoOrderCount;
  const promoRevenuePercent = totalRevenue > 0 ? (promoImpact.promoRevenue / totalRevenue) * 100 : 0;
  const promoOrderPercent = totalOrders > 0 ? (promoImpact.promoOrderCount / totalOrders) * 100 : 0;

  const aovDifference = promoImpact.nonPromoAvgOrderValue - promoImpact.promoAvgOrderValue;
  const aovDifferencePercent = promoImpact.nonPromoAvgOrderValue > 0
    ? (aovDifference / promoImpact.nonPromoAvgOrderValue) * 100
    : 0;

  const orderChartData = [
    { name: "Promo", value: promoImpact.promoOrderCount, fill: "var(--chart-2)" },
    { name: "Regular", value: promoImpact.nonPromoOrderCount, fill: "var(--chart-4)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightning weight="duotone" className="h-5 w-5 text-amber-500" />
          Promotion Impact Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt weight="duotone" className="h-4 w-4" />
              <span className="text-sm">Promo Revenue</span>
            </div>
            <div className="mt-1 text-2xl font-bold">
              {formatCurrency(promoImpact.promoRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {promoRevenuePercent.toFixed(1)}% of total
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingCart weight="duotone" className="h-4 w-4" />
              <span className="text-sm">Promo Orders</span>
            </div>
            <div className="mt-1 text-2xl font-bold">
              {formatNumber(promoImpact.promoOrderCount)}
            </div>
            <div className="text-xs text-muted-foreground">
              {promoOrderPercent.toFixed(1)}% of orders
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lightning weight="duotone" className="h-4 w-4" />
              <span className="text-sm">Promo AOV</span>
            </div>
            <div className="mt-1 text-2xl font-bold">
              {formatCurrency(promoImpact.promoAvgOrderValue)}
            </div>
            <div className="text-xs text-muted-foreground">
              per promo order
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendDown weight="duotone" className="h-4 w-4" />
              <span className="text-sm">AOV Difference</span>
            </div>
            <div className={`mt-1 text-2xl font-bold ${aovDifference > 0 ? "text-rose-500" : "text-emerald-500"}`}>
              {aovDifference > 0 ? "-" : "+"}{formatCurrency(Math.abs(aovDifference))}
            </div>
            <div className="text-xs text-muted-foreground">
              {aovDifferencePercent.toFixed(1)}% vs regular
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Order Distribution</h4>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={orderChartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={60} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {orderChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Revenue Comparison</h4>
            <div className="space-y-4 pt-2">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-chart-2" />
                    Promo Revenue
                  </span>
                  <span className="font-medium">{formatCurrency(promoImpact.promoRevenue)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-chart-2 transition-all"
                    style={{ width: `${promoRevenuePercent}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-chart-4" />
                    Regular Revenue
                  </span>
                  <span className="font-medium">{formatCurrency(promoImpact.nonPromoRevenue)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-chart-4 transition-all"
                    style={{ width: `${100 - promoRevenuePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight */}
        {aovDifference > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <Lightning weight="fill" className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <h4 className="font-medium text-amber-600 dark:text-amber-400">
                  Promo Impact Insight
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Promo orders have a {formatCurrency(aovDifference)} ({aovDifferencePercent.toFixed(1)}%) lower 
                  average order value compared to regular orders. Consider reviewing your 2-for-1 promotions 
                  to ensure they're driving profitable volume, not just discounted sales.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

