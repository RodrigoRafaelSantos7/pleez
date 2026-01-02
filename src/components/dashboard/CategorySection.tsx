import type { MenuItemAnalytics } from "#convex/analytics";
import { RecommendationCard } from "./RecommendationCard";
import { Badge } from "~/components/ui/badge";
import {
  Megaphone,
  CurrencyCircleDollar,
  Trash,
  CheckCircle,
} from "@phosphor-icons/react";

type CategorySectionProps = {
  category: "promote" | "price_optimize" | "rename_remove" | "maintain";
  items: MenuItemAnalytics[];
};

const categoryConfig = {
  promote: {
    title: "Promote",
    description: "High margin items with growth potential. Push these in marketing!",
    icon: Megaphone,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    gradient: "from-emerald-500/5 via-transparent to-transparent",
  },
  price_optimize: {
    title: "Price Optimize",
    description: "High volume but low margin. Consider raising prices.",
    icon: CurrencyCircleDollar,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    gradient: "from-amber-500/5 via-transparent to-transparent",
  },
  rename_remove: {
    title: "Rename / Remove",
    description: "Low volume, low margin. Rebrand or phase out.",
    icon: Trash,
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    gradient: "from-rose-500/5 via-transparent to-transparent",
  },
  maintain: {
    title: "Maintain",
    description: "Performing well. Keep doing what you're doing.",
    icon: CheckCircle,
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    gradient: "from-sky-500/5 via-transparent to-transparent",
  },
};

export function CategorySection({ category, items }: CategorySectionProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className={`rounded-xl bg-linear-to-r ${config.gradient} p-4`}>
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${config.badgeClass}`}>
            <Icon weight="duotone" className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{config.title}</h2>
              <Badge variant="secondary" className="text-xs">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <RecommendationCard key={item.item_id} item={item} />
        ))}
      </div>
    </section>
  );
}

