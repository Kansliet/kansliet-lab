"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  id?: string;
  name: string;
  min?: number;
  max: number;
  defaultValue?: number;
  /** Let the value be typed as well as stepped (admin stock: 12 → 200 in one go). */
  editable?: boolean;
  className?: string;
};

/* The − / + stepper from the cart, as a form field: the value travels in a
   hidden input, so the enclosing server-action form reads it like before. */
export function QuantityStepper({
  id,
  name,
  min = 1,
  max,
  defaultValue = 1,
  editable,
  className,
}: QuantityStepperProps) {
  const [value, setValue] = useState(defaultValue);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const stepButton =
    "flex w-9 shrink-0 items-center justify-center text-sm transition-opacity hover:opacity-60 disabled:pointer-events-none disabled:opacity-25";
  const valueCell =
    "w-full min-w-0 flex-1 border-x border-foreground bg-transparent py-3.5 text-center text-sm tabular-nums";

  return (
    <div className={cn("flex items-stretch border-brutal", className)}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-label="Decrease quantity"
        aria-controls={id}
        disabled={value <= min}
        onClick={() => setValue((v) => clamp(v - 1))}
        className={stepButton}
      >
        −
      </button>
      {editable ? (
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setValue(digits ? clamp(Number(digits)) : min);
          }}
          onFocus={(e) => e.target.select()}
          className={cn(valueCell, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground")}
        />
      ) : (
        <output id={id} aria-live="polite" className={valueCell}>
          {value}
        </output>
      )}
      <button
        type="button"
        aria-label="Increase quantity"
        aria-controls={id}
        disabled={value >= max}
        onClick={() => setValue((v) => clamp(v + 1))}
        className={stepButton}
      >
        +
      </button>
    </div>
  );
}
