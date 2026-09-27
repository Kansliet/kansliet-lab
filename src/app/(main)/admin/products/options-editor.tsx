"use client";

import { useEffect, useId, useState } from "react";
import type { ProductOption } from "@/lib/products";
import { MAX_COMBINATIONS, MAX_OPTION_VALUES, MAX_OPTIONS } from "@/lib/product-form";
import { PhotoManager } from "./photo-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EditorVariant = { id: number; option1: string | null; option2: string | null; stock: number };

type EditorValue = { key: string; value: string; was: string | null; images: string[] };
type EditorOption = { key: string; name: string; values: EditorValue[] };

let counter = 0;
const newKey = () => `k${++counter}`;

const SUGGESTED = ["Colour", "Size"];

function fromOptions(options: ProductOption[]): EditorOption[] {
  return options.map((option) => ({
    key: newKey(),
    name: option.name,
    values: option.values.map((value) => ({
      key: newKey(),
      value: value.value,
      was: value.value,
      images: value.images ?? [],
    })),
  }));
}

/**
 * Which existing variant each combination continues, matched on the values'
 * saved names (`was`), so renaming a colour keeps its stock and Stripe
 * product. Adding a second option hands each colour's variant to its first
 * size; removing it hands it back; a product gaining options hands its
 * default variant to the first combination. Each variant is used once.
 */
function matchVariants(options: EditorOption[], existing: EditorVariant[]) {
  const used = new Set<number>();
  const take = (find: (v: EditorVariant) => boolean) => {
    const found = existing.find((v) => !used.has(v.id) && find(v));
    if (found) used.add(found.id);
    return found;
  };
  const [first, second] = options;
  type Combo = { v1: EditorValue; v2: EditorValue | undefined; index: number };
  const combos = first.values.flatMap((v1): Combo[] =>
    second ? second.values.map((v2, index) => ({ v1, v2, index })) : [{ v1, v2: undefined, index: 0 }],
  );
  // Exact matches first, so fallbacks never steal a variant that has one.
  const matched = combos.map(({ v1, v2 }) =>
    take((v) => v.option1 === v1.was && v.option2 === (v2?.was ?? null) && v1.was !== null),
  );
  return combos.map((combo, i) => {
    const variant =
      matched[i] ??
      (combo.v2 && combo.index === 0 ? take((v) => v.option1 === combo.v1.was && v.option2 === null) : undefined) ??
      (!combo.v2 ? take((v) => v.option1 === combo.v1.was && combo.v1.was !== null) : undefined) ??
      (i === 0 ? take((v) => v.option1 === null) : undefined);
    return { ...combo, key: `${combo.v1.key}|${combo.v2?.key ?? ""}`, variant };
  });
}

/**
 * Colour / Size and their values, photos per colour, and a stock field per
 * combination. Submits two hidden JSON fields, `options` and `variants`,
 * which the server parses (parseOptions / parseVariantRows). Lives outside
 * the part of the form that remounts after a failed save, like the photos.
 */
export function OptionsEditor({
  initial,
  existing,
  onBusyChange,
  onHasOptionsChange,
}: {
  initial: ProductOption[];
  existing: EditorVariant[];
  onBusyChange: (busy: boolean) => void;
  onHasOptionsChange: (has: boolean) => void;
}) {
  const id = useId();
  const [options, setOptions] = useState(() => fromOptions(initial));
  const [stock, setStock] = useState<Record<string, string>>({});

  const hasOptions = options.length > 0;
  useEffect(() => onHasOptionsChange(hasOptions), [hasOptions, onHasOptionsChange]);

  const update = (optionKey: string, change: (option: EditorOption) => EditorOption) =>
    setOptions((current) => current.map((option) => (option.key === optionKey ? change(option) : option)));
  const updateValue = (optionKey: string, valueKey: string, change: Partial<EditorValue>) =>
    update(optionKey, (option) => ({
      ...option,
      values: option.values.map((value) => (value.key === valueKey ? { ...value, ...change } : value)),
    }));

  const rows = hasOptions ? matchVariants(options, existing) : [];
  const submitted = rows.map(({ key, v1, v2, variant }) => ({
    id: variant?.id ?? null,
    option1: v1.value.trim(),
    option2: v2 ? v2.value.trim() : null,
    stock: stock[key] ?? String(variant?.stock ?? 0),
    previous: variant?.stock ?? null,
  }));
  const optionsJson = options.map((option, index) => ({
    name: option.name.trim(),
    values: option.values.map((value) =>
      index === 0 ? { value: value.value.trim(), images: value.images } : { value: value.value.trim() },
    ),
  }));

  return (
    <div className="space-y-6">
      <input type="hidden" name="options" value={JSON.stringify(optionsJson)} />
      <input type="hidden" name="variants" value={JSON.stringify(submitted)} />

      {options.map((option, index) => (
        <fieldset key={option.key} className="space-y-3 border-brutal p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor={`${id}-${option.key}`} className="dossier-label mb-2">
                OPTION {index + 1}
              </label>
              <Input
                id={`${id}-${option.key}`}
                value={option.name}
                onChange={(e) => update(option.key, (o) => ({ ...o, name: e.target.value }))}
                placeholder={SUGGESTED[index]}
                className="text-normal-case tracking-normal"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="py-3.5"
              onClick={() => setOptions((current) => current.filter((o) => o.key !== option.key))}
            >
              REMOVE OPTION
            </Button>
          </div>

          <ul className="space-y-3">
            {option.values.map((value) => (
              <li key={value.key} className="space-y-2">
                <div className="flex items-center gap-3">
                  <Input
                    aria-label={`${option.name || "Option"} value`}
                    value={value.value}
                    onChange={(e) => updateValue(option.key, value.key, { value: e.target.value })}
                    placeholder={index === 0 ? "Sand" : "M"}
                    className="text-normal-case tracking-normal"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${value.value || "value"}`}
                    onClick={() =>
                      update(option.key, (o) => ({ ...o, values: o.values.filter((v) => v.key !== value.key) }))
                    }
                    className="text-caps shrink-0 cursor-pointer text-sm opacity-60 hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
                {/* Photos per value of the first option (the colour). */}
                {index === 0 && (
                  <PhotoManager
                    initial={value.images}
                    name={null}
                    pickerId={`${id}-photos-${value.key}`}
                    onBusyChange={onBusyChange}
                    onChange={(images) => updateValue(option.key, value.key, { images })}
                    hint={`Photos of ${value.value || "this value"}; the first is its swatch and cover. The product's shared photos follow them.`}
                  />
                )}
              </li>
            ))}
          </ul>
          {option.values.length < MAX_OPTION_VALUES && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                update(option.key, (o) => ({
                  ...o,
                  values: [...o.values, { key: newKey(), value: "", was: null, images: [] }],
                }))
              }
            >
              + ADD {(option.name || "VALUE").toUpperCase()}
            </Button>
          )}
        </fieldset>
      ))}

      {options.length < MAX_OPTIONS && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            setOptions((current) => [
              ...current,
              {
                key: newKey(),
                name: SUGGESTED[current.length] ?? "",
                values: [{ key: newKey(), value: "", was: null, images: [] }],
              },
            ])
          }
        >
          + ADD OPTION ({(SUGGESTED[options.length] ?? "").toUpperCase()})
        </Button>
      )}

      {hasOptions && (
        <div>
          <p className="dossier-label mb-2">STOCK PER COMBINATION</p>
          {rows.length > MAX_COMBINATIONS ? (
            <p className="text-normal-case text-sm">
              {rows.length} combinations; at most {MAX_COMBINATIONS}. Remove some values.
            </p>
          ) : (
            <table className="w-full max-w-md text-left text-sm">
              <tbody>
                {rows.map(({ key, v1, v2, variant }) => (
                  <tr key={key} className="border-b border-foreground/15">
                    <td className="py-1.5 pr-4 uppercase tracking-wider">
                      {[v1.value || "…", v2 && (v2.value || "…")].filter(Boolean).join(" / ")}
                      {!variant && <span className="ml-2 opacity-50">NEW</span>}
                    </td>
                    <td className="w-28 py-1.5">
                      <Input
                        aria-label={`Stock, ${v1.value} ${v2?.value ?? ""}`}
                        inputMode="numeric"
                        value={stock[key] ?? String(variant?.stock ?? 0)}
                        onChange={(e) =>
                          setStock((current) => ({ ...current, [key]: e.target.value.replace(/\D/g, "") }))
                        }
                        className="py-1.5 text-right tabular-nums"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-normal-case mt-2 text-sm font-light opacity-60">
            Combinations you remove are deleted (past orders keep their label). One price for all.
          </p>
        </div>
      )}
    </div>
  );
}
