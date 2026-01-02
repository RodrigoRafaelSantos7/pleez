import { query } from "./_generated/server";
import { v } from "convex/values";

export type MenuItemAnalytics = {
  item_id: number;
  item_name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  marginPercent: number;
  totalQuantity: number;
  revenue: number;
  profit: number;
  promoQuantity: number;
  nonPromoQuantity: number;
  promoRevenue: number;
  nonPromoRevenue: number;
  recommendation: "promote" | "price_optimize" | "rename_remove" | "maintain";
};

export type AnalyticsResult = {
  items: MenuItemAnalytics[];
  promote: MenuItemAnalytics[];
  priceOptimize: MenuItemAnalytics[];
  renameRemove: MenuItemAnalytics[];
  maintain: MenuItemAnalytics[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    promoOrdersPercent: number;
    avgMargin: number;
  };
  promoImpact: {
    promoRevenue: number;
    nonPromoRevenue: number;
    promoOrderCount: number;
    nonPromoOrderCount: number;
    promoAvgOrderValue: number;
    nonPromoAvgOrderValue: number;
  };
};

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
        nonPromoQuantity: number;
        promoRevenue: number;
        nonPromoRevenue: number;
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
        nonPromoQuantity: 0,
        promoRevenue: 0,
        nonPromoRevenue: 0,
      };

      stats.totalQuantity += order.quantity;
      const orderRevenue = order.quantity * menuItem.selling_price;

      if (order.is_promo) {
        stats.promoQuantity += order.quantity;
        stats.promoRevenue += orderRevenue;
        totalPromoOrders++;
      } else {
        stats.nonPromoQuantity += order.quantity;
        stats.nonPromoRevenue += orderRevenue;
        totalNonPromoOrders++;
      }

      itemStats.set(order.item_id, stats);
    }

    // Calculate analytics for each menu item
    const itemAnalytics: MenuItemAnalytics[] = menuItems.map((item) => {
      const stats = itemStats.get(String(item.item_id)) || {
        totalQuantity: 0,
        promoQuantity: 0,
        nonPromoQuantity: 0,
        promoRevenue: 0,
        nonPromoRevenue: 0,
      };

      const marginPercent = ((item.selling_price - item.cost_price) / item.selling_price) * 100;
      const revenue = stats.totalQuantity * item.selling_price;
      const profit = stats.totalQuantity * (item.selling_price - item.cost_price);

      return {
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        marginPercent: Math.round(marginPercent * 10) / 10,
        totalQuantity: stats.totalQuantity,
        revenue: Math.round(revenue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        promoQuantity: stats.promoQuantity,
        nonPromoQuantity: stats.nonPromoQuantity,
        promoRevenue: Math.round(stats.promoRevenue * 100) / 100,
        nonPromoRevenue: Math.round(stats.nonPromoRevenue * 100) / 100,
        recommendation: "maintain" as const,
      };
    });

    // Calculate median volume for categorization
    const quantities = itemAnalytics
      .map((item) => item.totalQuantity)
      .filter((q) => q > 0)
      .sort((a, b) => a - b);
    const medianQuantity =
      quantities.length > 0 ? quantities[Math.floor(quantities.length / 2)] : 0;

    // Categorize items
    const HIGH_MARGIN_THRESHOLD = 65;

    for (const item of itemAnalytics) {
      const isHighMargin = item.marginPercent >= HIGH_MARGIN_THRESHOLD;
      const isHighVolume = item.totalQuantity >= medianQuantity;

      if (isHighMargin && !isHighVolume) {
        item.recommendation = "promote";
      } else if (!isHighMargin && isHighVolume) {
        item.recommendation = "price_optimize";
      } else if (!isHighMargin && !isHighVolume && item.totalQuantity > 0) {
        item.recommendation = "rename_remove";
      } else {
        item.recommendation = "maintain";
      }
    }

    // Group by recommendation
    const promote = itemAnalytics.filter((i) => i.recommendation === "promote");
    const priceOptimize = itemAnalytics.filter((i) => i.recommendation === "price_optimize");
    const renameRemove = itemAnalytics.filter((i) => i.recommendation === "rename_remove");
    const maintain = itemAnalytics.filter((i) => i.recommendation === "maintain");

    // Calculate summary stats
    const totalRevenue = itemAnalytics.reduce((sum, i) => sum + i.revenue, 0);
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
    const nonPromoRevenue = itemAnalytics.reduce((sum, i) => sum + i.nonPromoRevenue, 0);

    return {
      items: itemAnalytics,
      promote,
      priceOptimize,
      renameRemove,
      maintain,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalOrders,
        promoOrdersPercent,
        avgMargin,
      },
      promoImpact: {
        promoRevenue: Math.round(promoRevenue * 100) / 100,
        nonPromoRevenue: Math.round(nonPromoRevenue * 100) / 100,
        promoOrderCount: totalPromoOrders,
        nonPromoOrderCount: totalNonPromoOrders,
        promoAvgOrderValue:
          totalPromoOrders > 0 ? Math.round((promoRevenue / totalPromoOrders) * 100) / 100 : 0,
        nonPromoAvgOrderValue:
          totalNonPromoOrders > 0
            ? Math.round((nonPromoRevenue / totalNonPromoOrders) * 100) / 100
            : 0,
      },
    };
  },
});
