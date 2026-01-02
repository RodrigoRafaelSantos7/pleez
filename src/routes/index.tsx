import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "#convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const { data } = useSuspenseQuery(convexQuery(api.orders.get, {}));
  return (
    <div>
      <h1>Orders</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
