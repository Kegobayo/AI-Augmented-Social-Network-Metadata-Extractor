import { type ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Small "?" marker that explains a metric on hover, focus or tap. */
export function Hint({
  text,
  side = "top",
  className,
}: {
  text: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={text}
            className={cn(
              "inline-flex size-3.5 shrink-0 cursor-help items-center justify-center rounded-full border border-border bg-secondary text-[9px] font-bold leading-none text-muted-foreground outline-none transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            ?
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={6}
          className="max-w-64 text-left font-sans text-xs font-normal normal-case leading-relaxed tracking-normal"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** A metric label followed by its "?" explanation. */
export function MetricLabel({
  label,
  text,
  side,
  className,
}: {
  label: ReactNode;
  text: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span>{label}</span>
      <Hint text={text} side={side} />
    </span>
  );
}
