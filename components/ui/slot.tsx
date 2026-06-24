import * as React from "react";
import { cn } from "@/lib/utils";

interface SlotProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

/**
 * Minimal Slot: merges its props onto a single child element so components
 * can offer an `asChild` API (e.g. render a Button's styles onto a Link)
 * without pulling in @radix-ui/react-slot.
 */
export function Slot({ children, className, ...props }: SlotProps) {
  if (!React.isValidElement(children)) return null;
  const child = children as React.ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  return React.cloneElement(child, {
    ...props,
    ...childProps,
    className: cn(className, childProps.className as string | undefined),
  });
}
