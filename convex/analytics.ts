import { query } from "./_generated/server";
import { v } from "convex/values";

export type MenuItemAnalytics = {
  item_id: number;
  item_name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  /**
   * Unit margin at list price (ignores promos).
   * This is a property of the menu item, not of promo performance.
   */
  marginPercent: number;
  unitMargin: number;
  totalQuantity: number;
  /**
   * Net realized revenue (promo-aware).
   * For 2-for-1 promos we assume paidUnits = ceil(deliveredUnits / 2).
   */
  revenue: number;
  /**
   * Gross "list" revenue ignoring discounts (always deliveredUnits * listPrice).
   * Useful to understand discount impact.
   */
  listRevenue: number;
  /**
   * Promo-aware profit: net revenue minus COGS on delivered units.
   */
  profit: number;
  promoProfit: number;
  nonPromoProfit: number;
  promoQuantity: number;
  promoPaidQuantity: number;
  nonPromoQuantity: number;
  promoRevenue: number;
  promoListRevenue: number;
  nonPromoRevenue: number;
  promoDiscountPercent: number;
  recommendation: "promote" | "price_optimize" | "rename_remove" | "maintain";
  recommendationWhy: string;
  confidence: "low" | "medium" | "high";
};

export type AnalyticsResult = {
  items: MenuItemAnalytics[];
  promote: MenuItemAnalytics[];
  priceOptimize: MenuItemAnalytics[];
  renameRemove: MenuItemAnalytics[];
  maintain: MenuItemAnalytics[];
  summary: {
    totalRevenue: number;
    totalListRevenue: number;
    totalProfit: number;
    totalOrders: number;
    promoOrdersPercent: number;
    avgMargin: number;
  };
  promoImpact: {
    promoRevenue: number; // net promo revenue (promo-aware)
    promoListRevenue: number; // list/gross revenue for promo units
    promoProfit: number;
    nonPromoRevenue: number;
    nonPromoProfit: number;
    promoOrderCount: number; // NOTE: counts order lines in this dataset (not basket-level orders)
    nonPromoOrderCount: number; // NOTE: counts order lines in this dataset (not basket-level orders)
    promoAvgOrderValue: number; // net revenue / promoOrderCount
    nonPromoAvgOrderValue: number;
    promoDiscountPercent: number; // overall effective discount on promo units
  };
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * 2-for-1 modeling assumption:
 * - `quantity` is delivered units.
 * - Customer pays for `ceil(quantity/2)` units.
 * - COGS applies to all delivered units (including the "free" one).
 */
function paidUnitsForTwoForOne(deliveredUnits: number): number {
  return Math.ceil(deliveredUnits / 2);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const baseVal = sorted[base] ?? 0;
  const nextVal = sorted[base + 1] ?? baseVal;
  return baseVal + rest * (nextVal - baseVal);
}

export const getMenuAnalytics = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AnalyticsResult> => {
    // Fetch all menu items
    const menuItems = await ctx.db.query("menuItems").collect();

    // Fetch orders with optional filtering
    let orders = await ctx.db.query("orders").collect();

    // Apply date filtering
    if (args.startDate) {
      orders = orders.filter((order) => order.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      orders = orders.filter((order) => order.timestamp <= args.endDate!);
    }

    // Apply platform filtering
    if (args.platform && args.platform !== "all") {
      orders = orders.filter((order) => order.platform === args.platform);
    }

    // Create a map for quick menu item lookup
    const menuItemMap = new Map(menuItems.map((item) => [String(item.item_id), item]));

    // Aggregate order data per item
    const itemStats = new Map<
      string,
      {
        totalQuantity: number;
        promoQuantity: number;
        promoPaidQuantity: number;
        nonPromoQuantity: number;
        promoRevenue: number; // net promo revenue (promo-aware)
        promoListRevenue: number; // list/gross revenue for promo units
        nonPromoRevenue: number;
        promoProfit: number;
        nonPromoProfit: number;
      }
    >();

    let totalPromoOrders = 0;
    let totalNonPromoOrders = 0;

    for (const order of orders) {
      const menuItem = menuItemMap.get(order.item_id);
      if (!menuItem) continue;

      const stats = itemStats.get(order.item_id) || {
        totalQuantity: 0,
        promoQuantity: 0,
        promoPaidQuantity: 0,
        nonPromoQuantity: 0,
        promoRevenue: 0,
        promoListRevenue: 0,
        nonPromoRevenue: 0,
        promoProfit: 0,
        nonPromoProfit: 0,
      };

      stats.totalQuantity += order.quantity;
      const listRevenue = order.quantity * menuItem.selling_price;
      const cogs = order.quantity * menuItem.cost_price;

      if (order.is_promo) {
        stats.promoQuantity += order.quantity;
        const paidUnits = paidUnitsForTwoForOne(order.quantity);
        const promoRevenue = paidUnits * menuItem.selling_price;
        stats.promoPaidQuantity += paidUnits;
        stats.promoRevenue += promoRevenue;
        stats.promoListRevenue += listRevenue;
        stats.promoProfit += promoRevenue - cogs;
        totalPromoOrders++;
      } else {
        stats.nonPromoQuantity += order.quantity;
        stats.nonPromoRevenue += listRevenue;
        stats.nonPromoProfit += listRevenue - cogs;
        totalNonPromoOrders++;
      }

      itemStats.set(order.item_id, stats);
    }

    // Calculate analytics for each menu item
    const itemAnalytics: MenuItemAnalytics[] = menuItems.map((item) => {
      const stats = itemStats.get(String(item.item_id)) || {
        totalQuantity: 0,
        promoQuantity: 0,
        promoPaidQuantity: 0,
        nonPromoQuantity: 0,
        promoRevenue: 0,
        promoListRevenue: 0,
        nonPromoRevenue: 0,
        promoProfit: 0,
        nonPromoProfit: 0,
      };

      const marginPercent = ((item.selling_price - item.cost_price) / item.selling_price) * 100;
      const unitMargin = item.selling_price - item.cost_price;

      // Promo-aware net revenue: promoRevenue is already net (paidUnits * listPrice)
      const revenue = stats.promoRevenue + stats.nonPromoRevenue;
      const listRevenue = stats.totalQuantity * item.selling_price;
      const profit = stats.promoProfit + stats.nonPromoProfit;
      const promoDiscountPercent =
        stats.promoListRevenue > 0 ? (1 - stats.promoRevenue / stats.promoListRevenue) * 100 : 0;

      return {
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        marginPercent: round1(marginPercent),
        unitMargin: round2(unitMargin),
        totalQuantity: stats.totalQuantity,
        revenue: round2(revenue),
        listRevenue: round2(listRevenue),
        profit: round2(profit),
        promoProfit: round2(stats.promoProfit),
        nonPromoProfit: round2(stats.nonPromoProfit),
        promoQuantity: stats.promoQuantity,
        promoPaidQuantity: stats.promoPaidQuantity,
        nonPromoQuantity: stats.nonPromoQuantity,
        promoRevenue: round2(stats.promoRevenue),
        promoListRevenue: round2(stats.promoListRevenue),
        nonPromoRevenue: round2(stats.nonPromoRevenue),
        promoDiscountPercent: round1(promoDiscountPercent),
        recommendation: "maintain" as const,
        recommendationWhy: "",
        confidence: "low" as const,
      };
    });

    // Build distribution stats (for relative scoring / guardrails)
    const quantitiesAll = itemAnalytics.map((i) => i.totalQuantity).sort((a, b) => a - b);
    const marginPercentsAll = itemAnalytics.map((i) => i.marginPercent).sort((a, b) => a - b);
    const q25Qty = quantile(quantitiesAll, 0.25);
    const q50Qty = quantile(quantitiesAll, 0.5);
    const q75Qty = quantile(quantitiesAll, 0.75);
    const q50Margin = quantile(marginPercentsAll, 0.5);
    const q75Margin = quantile(marginPercentsAll, 0.75);

    const MIN_UNITS_FOR_MED_CONFIDENCE = 15;
    const MIN_UNITS_FOR_HIGH_CONFIDENCE = 40;

    for (const item of itemAnalytics) {
      // Confidence based on sample size (delivered units).
      item.confidence =
        item.totalQuantity >= MIN_UNITS_FOR_HIGH_CONFIDENCE
          ? "high"
          : item.totalQuantity >= MIN_UNITS_FOR_MED_CONFIDENCE
            ? "medium"
            : "low";

      const isHighVolume = item.totalQuantity >= q75Qty;
      const isLowVolume = item.totalQuantity <= q25Qty;
      const isMidOrLowerVolume = item.totalQuantity <= q50Qty;

      const isHighMargin = item.marginPercent >= q75Margin;
      const isLowMargin = item.marginPercent <= q50Margin;

      const promoMixPercent =
        item.totalQuantity > 0 ? (item.promoQuantity / item.totalQuantity) * 100 : 0;
      const promoProfitPerDeliveredUnit =
        item.promoQuantity > 0 ? item.promoProfit / item.promoQuantity : 0;

      // Guardrails: don’t recommend “promote” if promo economics are clearly destructive.
      const promoIsClearlyUnprofitable = item.promoQuantity > 0 && promoProfitPerDeliveredUnit < 0;

      if (isHighMargin && isMidOrLowerVolume && !promoIsClearlyUnprofitable) {
        item.recommendation = "promote";
        item.recommendationWhy =
          `High unit margin (${item.marginPercent}%) with lower-than-typical volume (${item.totalQuantity} units).` +
          (item.promoQuantity > 0
            ? ` Promo mix ${round1(promoMixPercent)}% and promo profit/unit ${round2(promoProfitPerDeliveredUnit)}.`
            : " Not currently driven by promos.");
        continue;
      }

      if (isHighVolume && isLowMargin) {
        item.recommendation = "price_optimize";
        item.recommendationWhy =
          `High volume (${item.totalQuantity} units) but below-median unit margin (${item.marginPercent}%).` +
          ` Consider small price tests or cost reduction to improve contribution without losing demand.`;
        continue;
      }

      if (isLowVolume && isLowMargin && item.totalQuantity > 0) {
        item.recommendation = "rename_remove";
        item.recommendationWhy =
          `Low demand (${item.totalQuantity} units) and weak unit margin (${item.marginPercent}%).` +
          ` Candidate for rename/repositioning or removal if it adds menu complexity.`;
        continue;
      }

      // Fallback: maintain
      item.recommendation = "maintain";
      item.recommendationWhy =
        item.totalQuantity === 0
          ? "No sales in the selected period. Keep listed and monitor, or verify item availability/visibility."
          : `Balanced performance versus peers (volume around P50=${Math.round(q50Qty)}, margin P50=${round1(q50Margin)}%).`;
    }

    // Group by recommendation
    const promote = itemAnalytics.filter((i) => i.recommendation === "promote");
    const priceOptimize = itemAnalytics.filter((i) => i.recommendation === "price_optimize");
    const renameRemove = itemAnalytics.filter((i) => i.recommendation === "rename_remove");
    const maintain = itemAnalytics.filter((i) => i.recommendation === "maintain");

    // Calculate summary stats
    const totalRevenue = itemAnalytics.reduce((sum, i) => sum + i.revenue, 0);
    const totalListRevenue = itemAnalytics.reduce((sum, i) => sum + i.listRevenue, 0);
    const totalProfit = itemAnalytics.reduce((sum, i) => sum + i.profit, 0);
    const totalOrders = orders.length;
    const promoOrdersPercent =
      totalOrders > 0 ? Math.round((totalPromoOrders / totalOrders) * 100 * 10) / 10 : 0;
    const avgMargin =
      itemAnalytics.length > 0
        ? Math.round(
            (itemAnalytics.reduce((sum, i) => sum + i.marginPercent, 0) / itemAnalytics.length) *
              10,
          ) / 10
        : 0;

    // Calculate promo impact
    const promoRevenue = itemAnalytics.reduce((sum, i) => sum + i.promoRevenue, 0);
    const promoListRevenue = itemAnalytics.reduce((sum, i) => sum + i.promoListRevenue, 0);
    const promoProfit = itemAnalytics.reduce((sum, i) => sum + i.promoProfit, 0);
    const nonPromoRevenue = itemAnalytics.reduce((sum, i) => sum + i.nonPromoRevenue, 0);
    const nonPromoProfit = itemAnalytics.reduce((sum, i) => sum + i.nonPromoProfit, 0);
    const promoDiscountPercent =
      promoListRevenue > 0 ? Math.round((1 - promoRevenue / promoListRevenue) * 100 * 10) / 10 : 0;

    return {
      items: itemAnalytics,
      promote,
      priceOptimize,
      renameRemove,
      maintain,
      summary: {
        totalRevenue: round2(totalRevenue),
        totalListRevenue: round2(totalListRevenue),
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalOrders,
        promoOrdersPercent,
        avgMargin,
      },
      promoImpact: {
        promoRevenue: round2(promoRevenue),
        promoListRevenue: round2(promoListRevenue),
        promoProfit: round2(promoProfit),
        nonPromoRevenue: round2(nonPromoRevenue),
        nonPromoProfit: round2(nonPromoProfit),
        promoOrderCount: totalPromoOrders,
        nonPromoOrderCount: totalNonPromoOrders,
        promoAvgOrderValue:
          totalPromoOrders > 0 ? Math.round((promoRevenue / totalPromoOrders) * 100) / 100 : 0,
        nonPromoAvgOrderValue:
          totalNonPromoOrders > 0
            ? Math.round((nonPromoRevenue / totalNonPromoOrders) * 100) / 100
            : 0,
        promoDiscountPercent,
      },
    };
  },
});
