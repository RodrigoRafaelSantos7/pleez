import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  menuItems: defineTable({
    item_id: v.number(),
    item_name: v.string(),
    category: v.string(),
    cost_price: v.number(),
    selling_price: v.number(),
  }).index("by_item_id", ["item_id"]),

  orders: defineTable({
    order_id: v.string(),
    item_id: v.string(),
    quantity: v.number(),
    is_promo: v.boolean(),
    platform: v.string(),
    timestamp: v.string(),
  })
    .index("by_item_id", ["item_id"])
    .index("by_platform", ["platform"])
    .index("by_timestamp", ["timestamp"]),
});
