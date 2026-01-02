import { LoadingButton } from "~/components/ui/loading-button";
import type { Button } from "~/components/ui/button";
import { useFormContext } from "~/components/form/context";

export function SubmitButton(props: React.ComponentProps<typeof Button>) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <LoadingButton type="submit" isLoading={isSubmitting} disabled={!canSubmit} {...props}>
          {props.children}
        </LoadingButton>
      )}
    </form.Subscribe>
  );
}
