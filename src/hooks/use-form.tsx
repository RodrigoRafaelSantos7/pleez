import type { AnyFormApi } from "@tanstack/react-form";
import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "~/components/form/context";
import { SelectField } from "~/components/form/select-field";
import { SubmitButton } from "~/components/form/submit-button";
import { TextField } from "~/components/form/text-field";
import { TextareaField } from "~/components/form/textarea-field";

function Form<_TForm extends AnyFormApi>({
  form,
  children,
  ...props
}: Omit<React.ComponentPropsWithRef<"form">, "onSubmit"> & {
  form: _TForm;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      {...props}
    >
      <formContext.Provider value={form}>{children}</formContext.Provider>
    </form>
  );
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    SelectField,
  },
  formComponents: {
    SubmitButton,
    Form,
  },
});
