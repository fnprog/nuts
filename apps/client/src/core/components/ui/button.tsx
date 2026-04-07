import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  [
    "relative isolate inline-flex origin-center items-center justify-center gap-2 whitespace-nowrap select-none rounded-lg font-medium",
    "transition-all duration-200 transform-gpu",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97] motion-reduce:transition-none",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        default:
          "bg-accent text-accent-foreground hover:bg-accent-hover shadow-sm active:scale-[0.97]",
        tertiary:
          "bg-default text-default-foreground hover:bg-default-hover active:scale-[0.97]",
        destructive:
          "bg-destructive text-destructive-foreground border-[1.5px] cursor-pointer border-[rgba(136,14,79,0.4)] bg-gradient-to-b from-[#c2185b] to-[#ad1457] text-white font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-gradient-to-b hover:from-[#d81b60] hover:to-[#c2185b] active:bg-gradient-to-b active:from-[#ad1457] active:to-[#880e4f] overflow-hidden grain-effect ",
        "danger-soft":
          "bg-danger-soft text-danger-soft-foreground hover:bg-danger-soft-hover active:scale-[0.97]",
        outline:
          "border border-border bg-transparent text-default-foreground hover:bg-default-hover active:scale-[0.97]",
        secondary: "bg-default text-accent hover:bg-default-hover shadow-sm active:scale-[0.97]",
        ghost:
          "bg-transparent text-default-foreground hover:bg-default-hover active:scale-[0.97]",
        link: "text-accent underline-offset-4 hover:underline active:opacity-80",
        mono: "bg-black text-white hover:bg-black/90 shadow-sm active:scale-[0.97]",
      },
      size: {
        default: "h-10 md:h-9 px-4 py-6 has-[>svg]:px-3",
        sm: "h-9 md:h-8 px-3 has-[>svg]:px-2.5",
        lg: "h-11 md:h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
      state: {
        default: "",
        pending: "cursor-wait opacity-80",
        pressed: "scale-[0.97]",
        disabled: "opacity-60 cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
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
