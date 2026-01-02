import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { MenuItemAnalytics } from "#convex/analytics";
import { TrendUp, CurrencyEur, Package, Percent, Lightning, Info } from "@phosphor-icons/react";

type RecommendationCardProps = {
  item: MenuItemAnalytics;
};

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

const categoryColors: Record<string, string> = {
  Burger: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Side: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Drink: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const confidenceBadge: Record<MenuItemAnalytics["confidence"], string> = {
  low: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  high: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export function RecommendationCard({ item }: RecommendationCardProps) {
  const promoPercentage =
    item.totalQuantity > 0 ? Math.round((item.promoQuantity / item.totalQuantity) * 100) : 0;
  const promoPaidShare =
    item.promoQuantity > 0 ? Math.round((item.promoPaidQuantity / item.promoQuantity) * 100) : 0;

  return (
    <Card className="group hover:ring-primary/30 transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-base font-semibold">{item.item_name}</CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={categoryColors[item.category] || ""}>
                {item.category}
              </Badge>
              <Badge variant="outline" className={confidenceBadge[item.confidence]}>
                {item.confidence} confidence
              </Badge>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-primary">
              {formatCurrency(item.selling_price)}
            </div>
            <div className="text-xs text-muted-foreground">
              Unit cost: {formatCurrency(item.cost_price)}
            </div>
            <div className="text-xs text-muted-foreground">
              Unit margin: {formatCurrency(item.unitMargin)} ({item.marginPercent}%)
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <Percent weight="duotone" className="h-4 w-4 text-chart-3" />
            <div>
              <div className="text-xs text-muted-foreground">Unit Margin %</div>
              <div className="font-semibold">{item.marginPercent}%</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <Package weight="duotone" className="h-4 w-4 text-chart-2" />
            <div>
              <div className="text-xs text-muted-foreground">Units Sold</div>
              <div className="font-semibold">{formatNumber(item.totalQuantity)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <CurrencyEur weight="duotone" className="h-4 w-4 text-chart-1" />
            <div>
              <div className="text-xs text-muted-foreground">Net Revenue</div>
              <div className="font-semibold">{formatCurrency(item.revenue)}</div>
              <div className="text-[11px] text-muted-foreground">
                List: {formatCurrency(item.listRevenue)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <TrendUp weight="duotone" className="h-4 w-4 text-emerald-500" />
            <div>
              <div className="text-xs text-muted-foreground">Total Profit</div>
              <div className="font-semibold">{formatCurrency(item.profit)}</div>
              <div className="text-[11px] text-muted-foreground">
                Promo: {formatCurrency(item.promoProfit)} · Regular: {formatCurrency(item.nonPromoProfit)}
              </div>
            </div>
          </div>
        </div>

        {item.promoQuantity > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-2">
            <Lightning weight="fill" className="h-4 w-4 text-amber-500" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Sold via Promotions</div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatNumber(item.promoQuantity)} units ({promoPercentage}%)
                </span>
                <span className="text-xs text-muted-foreground">
                  = {formatCurrency(item.promoRevenue)} net (discount {item.promoDiscountPercent}%)
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Paid share: {promoPaidShare}% (2-for-1 model)
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border bg-card p-2">
          <Info weight="duotone" className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">{item.recommendationWhy}</div>
        </div>
      </CardContent>
    </Card>
  );
}
