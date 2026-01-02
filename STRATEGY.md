# BurgerBytes Menu Intelligence Strategy

This document explains **how the app analyzes menu performance** and how it decides whether an item should be **Promoted**, **Price Optimized**, or **Renamed/Removed**.

It is written to be understandable for both product/business stakeholders and engineers.

---

## Goals

BurgerBytes is spending heavily on **2-for-1 promotions**, but margins are bleeding. The goal of this app is to:

- **Identify items to Promote**: high margin and under-exposed items that can grow profitably.
- **Identify items to Price Optimize**: strong demand but weak margins.
- **Identify items to Rename/Remove**: low demand and weak margins (menu complexity with little payoff).

---

## Data model (what we have)

From the dataset/schema:

- **Menu items**: `item_id`, `item_name`, `category`, `cost_price`, `selling_price`
- **Orders (order lines)**: `order_id`, `item_id`, `quantity`, `is_promo`, `platform`, `timestamp`

Important: the dataset is modeled as **order lines** (each row is a single item line), not an entire basket. So counts labelled “orders” in the UI are effectively **order lines** unless we add true basket reconstruction.

---

## Core metrics

### Unit economics (at list price)

- **Unit margin**:  
  \[
  unitMargin = sellingPrice - costPrice
  \]

- **Unit margin percent** (a property of the menu item, not promo performance):  
  \[
  unitMarginPercent = \frac{sellingPrice - costPrice}{sellingPrice}
  \]

This is useful for comparing items, but it does **not** answer whether a promo is profitable.

---

## Promotion modeling: “2-for-1”

### Why the baseline approach is misleading

A common analytics trap is to compute promo revenue as:

- `revenue = quantity * selling_price`

This treats the promo as if the customer paid full price for every delivered unit. For a **2-for-1**, that overstates revenue and profit and can cause the system to recommend promoting items that actually lose money.

### The app’s 2-for-1 assumption

Because the dataset does not specify how “free units” are encoded, the app uses a documented assumption:

- `quantity` = **delivered units**
- for 2-for-1 promos, the customer pays for:
  \[
  paidUnits = \lceil \frac{deliveredUnits}{2} \rceil
  \]
- **COGS applies to all delivered units**, including the free item(s).

This is a realistic model for restaurant economics.

### Promo-aware revenue and profit

For a promo order line:

- **Promo net revenue**:
  \[
  promoRevenue = paidUnits \cdot sellingPrice
  \]
- **Promo list revenue** (what revenue would have been without discount):
  \[
  promoListRevenue = deliveredUnits \cdot sellingPrice
  \]
- **Promo profit**:
  \[
  promoProfit = promoRevenue - deliveredUnits \cdot costPrice
  \]
- **Effective promo discount percent**:
  \[
  promoDiscountPercent = 1 - \frac{promoRevenue}{promoListRevenue}
  \]

For a non-promo order line:

- **Regular revenue**:
  \[
  nonPromoRevenue = deliveredUnits \cdot sellingPrice
  \]
- **Regular profit**:
  \[
  nonPromoProfit = nonPromoRevenue - deliveredUnits \cdot costPrice
  \]

At an item level we aggregate across lines and report:

- `revenue` = promo net revenue + non-promo revenue (**realized / net**)  
- `listRevenue` = all delivered units * list price (**gross / list**)  
- `profit` = promo profit + non-promo profit

---

## Recommendation logic (business-friendly)

The app uses **relative performance** (how an item compares to peers) plus **guardrails**.

### Peer benchmarks

Across all items in the filtered period, we compute:

- **P25/P50/P75 volume** using `totalQuantity`
- **P50/P75 unit margin percent** using `unitMarginPercent`

### Confidence

We attach a simple confidence label from total sold units:

- **high**: \(\ge 40\) units
- **medium**: \(\ge 15\) units
- **low**: < 15 units

This prevents overreacting to small samples.

### Categories

#### Promote

An item is recommended to **Promote** when:

- It is **high margin** (≥ P75 margin)
- It is **not already high volume** (≤ P50 volume)
- And it is **not clearly unprofitable under promo** (if it has promo volume, promo profit per delivered unit must not be negative)

Intent: highlight items that are profitable per unit but not getting enough demand.

#### Price optimize

An item is recommended for **Price Optimization** when:

- It is **high volume** (≥ P75 volume)
- But **low margin** (≤ P50 margin)

Intent: small price increases or cost reductions on big sellers typically yield the fastest profit gains.

#### Rename / remove

An item is recommended to **Rename/Remove** when:

- It is **low volume** (≤ P25 volume)
- And **low margin** (≤ P50 margin)

Intent: reduce menu complexity, fix low performers, or rework naming/positioning before removal.

#### Maintain

Everything else, including:

- balanced performers
- items with **zero sales** in the time window (insufficient evidence)

---

## What “real-world” upgrades we’d do next

This app is a strong baseline, but real promo decisioning typically also needs:

- **Basket effects**: does promo increase total basket size or cannibalize other items?
- **Incremental lift**: compare promo vs non-promo demand under similar conditions (time, platform, store).
- **Platform fees and variable costs**: Uber/Deliveroo commissions, packaging, labor, refunds.
- **Time/seasonality segmentation**: lunch vs dinner, weekday vs weekend.
- **A/B testing**: validate “price optimize” recommendations with controlled tests.

---

## Where this is implemented

- Analytics and recommendation logic: `convex/analytics.ts`
- Dashboard view: `src/routes/index.tsx`
- Item cards: `src/components/dashboard/RecommendationCard.tsx`
- Promo impact panel: `src/components/dashboard/PromoImpactPanel.tsx`


