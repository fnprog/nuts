import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-sans text-foreground", {
  variants: {
    variant: {
      display: "text-5xl md:text-6xl font-bold tracking-tighter leading-[1.1]",
      h1: "text-3xl  font-bold tracking-tight leading-[1.2]",
      h2: "text-2xl  font-semibold tracking-tight leading-[1.2]",
      h3: "text-xl  font-semibold tracking-tight leading-[1.3]",
      h4: "text-lg  font-medium tracking-tight leading-[1.4]",
      h5: "text-base  font-medium leading-[1.5]",
      h6: "text-sm  font-medium leading-[1.5]",
    },
  },
  defaultVariants: {
    variant: "h1",
  },
});

function Display({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 data-slot="display" className={cn(headingVariants({ variant: "display" }), className)} {...props} />;
}

function H1({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 data-slot="h1" className={cn(headingVariants({ variant: "h1" }), className)} {...props} />;
}

function H2({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="h2" className={cn(headingVariants({ variant: "h2" }), className)} {...props} />;
}

function H3({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="h3" className={cn(headingVariants({ variant: "h3" }), className)} {...props} />;
}

function H4({ className, ...props }: React.ComponentProps<"h4">) {
  return <h4 data-slot="h4" className={cn(headingVariants({ variant: "h4" }), className)} {...props} />;
}

function H5({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 data-slot="h5" className={cn(headingVariants({ variant: "h5" }), className)} {...props} />;
}

function H6({ className, ...props }: React.ComponentProps<"h6">) {
  return <h6 data-slot="h6" className={cn(headingVariants({ variant: "h6" }), className)} {...props} />;
}

const textVariants = cva("font-sans text-foreground", {
  variants: {
    variant: {
      default: "text-base leading-7 font-normal",
      lead: "text-lg md:text-xl leading-relaxed font-normal",
      large: "text-base md:text-lg leading-7 font-normal",
      small: "text-sm leading-6 font-normal",
      muted: "text-sm leading-6 font-normal text-muted-foreground",
      subtle: "text-xs leading-5 font-normal text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function P({ className, variant, ...props }: React.ComponentProps<"p"> & VariantProps<typeof textVariants>) {
  return <p data-slot="p" className={cn(textVariants({ variant }), className)} {...props} />;
}

function Lead({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="lead" className={cn(textVariants({ variant: "lead" }), className)} {...props} />;
}

function Large({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="large" className={cn(textVariants({ variant: "large" }), className)} {...props} />;
}

function Small({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="small" className={cn(textVariants({ variant: "small" }), className)} {...props} />;
}

function Muted({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="muted" className={cn(textVariants({ variant: "muted" }), className)} {...props} />;
}

function Subtle({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="subtle" className={cn(textVariants({ variant: "subtle" }), className)} {...props} />;
}

function Blockquote({ className, ...props }: React.ComponentProps<"blockquote">) {
  return <blockquote data-slot="blockquote" className={cn("border-accent text-muted-foreground border-l-4 py-1 pl-4 italic", className)} {...props} />;
}

function List({ className, ordered = false, ...props }: (React.ComponentProps<"ul"> | React.ComponentProps<"ol">) & { ordered?: boolean }) {
  const Component = ordered ? "ol" : "ul";
  return (
    <Component
      data-slot={ordered ? "ol" : "ul"}
      className={cn("space-y-2 text-base leading-7", ordered ? "list-decimal" : "list-disc", "ml-6", className)}
      {...(props as any)}
    />
  );
}

function ListItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="li" className={cn("pl-1", className)} {...props} />;
}

function Code({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="code"
      className={cn("bg-muted text-foreground relative rounded px-[0.4rem] py-[0.2rem] font-mono text-sm font-medium", className)}
      {...props}
    />
  );
}

function InlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return <code data-slot="inline-code" className={cn("bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs font-medium", className)} {...props} />;
}

function Pre({ className, ...props }: React.ComponentProps<"pre">) {
  return (
    <pre data-slot="pre" className={cn("bg-muted text-foreground overflow-x-auto rounded-lg p-4 font-mono text-sm leading-relaxed", className)} {...props} />
  );
}

export {
  Display,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
  Lead,
  Large,
  Small,
  Muted,
  Subtle,
  Blockquote,
  List,
  ListItem,
  Code,
  InlineCode,
  Pre,
  headingVariants,
  textVariants,
};
