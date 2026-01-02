import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Spinner } from "~/components/ui/spinner";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "~/components/ui/button";

export function LoadingButton({
  isLoading,
  ...props
}: {
  isLoading: boolean;
} & Omit<React.ComponentPropsWithoutRef<"button">, "className"> &
  VariantProps<typeof buttonVariants> &
  Pick<React.ComponentProps<typeof Button>, "className">) {
  return (
    <Button
      {...props}
      {...((isLoading || ("disabled" in props && props.disabled)) && {
        "data-disabled": true,
      })}
      onClick={props.onClick}
      className={cn("relative overflow-hidden px-5 transition", props.className)}
    >
      <span
        aria-hidden={isLoading}
        className={cn(
          "flex items-center transition duration-300",
          isLoading && "translate-y-1.5 opacity-0",
        )}
      >
        {props.children}
      </span>
      <span
        aria-hidden={!isLoading}
        className={cn(
          "absolute inset-0 flex items-center justify-center transition duration-300",
          !isLoading && "-translate-y-1.5 opacity-0",
        )}
      >
        <Spinner aria-label="Loading" />
      </span>
    </Button>
  );
}
