import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  [
    "relative isolate inline-flex origin-center items-center justify-center gap-2",
    "whitespace-nowrap select-none font-medium rounded-lg",
    "transition-all duration-200 transform-gpu",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97] motion-reduce:transition-none",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Brand green — primary CTA
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",

        // Black — auth & high-emphasis actions
        mono: "bg-foreground text-background hover:bg-foreground/90 shadow-sm dark:bg-white dark:text-black dark:hover:bg-white/90",

        // Soft green tint — secondary actions alongside primary
        secondary: "bg-primary/10 text-primary hover:bg-primary/15",

        // Border only — equal-weight alternatives
        outline: "border border-border bg-transparent text-foreground hover:bg-default",

        // No chrome — icon buttons, toolbar actions
        ghost: "bg-transparent text-foreground hover:bg-default",

        // Destructive — flat, no theatrics
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",

        // Inline text link
        link: "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-3 text-sm has-[>svg]:px-2.5",
        default: "h-10 px-4 py-6 has-[>svg]:px-3 ",
        lg: "h-11 px-6 text-base has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        auto: "h-auto",
      },
      state: {
        default: "",
        pending: "cursor-wait opacity-70",
        pressed: "scale-[0.97]",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
      state: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  state,
  disabled,
  children,
  loading = false,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size, state, className }))} disabled={loading || disabled} {...props}>
      {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
      <Slottable>{children}</Slottable>
    </Comp>
  );
}

export { Button, buttonVariants };
