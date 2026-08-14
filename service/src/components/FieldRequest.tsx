"use client";

import type { PendingFieldView } from "@/core/service";

/**
 * Den här komponenten är hela principen, renderad.
 *
 * Ett fält dyker aldrig upp utan sin motivering: `reason` är obligatoriskt i
 * FieldDefinition, så det finns alltid något att skriva ut. Rubriken säger vad vi
 * behöver, brödtexten säger varför, och chippet säger vilken tjänst som frågade —
 * så att användaren kan avstå från just den tjänsten i stället för att avstå allt.
 */
export function FieldRequest({
  field,
  value,
  error,
  onChange,
}: {
  field: PendingFieldView;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const inputId = `field-${field.id}`;

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-surface p-6">
      <h3 className="font-serif text-xl">Vi behöver {field.label.toLowerCase()}</h3>

      {/* Ett skäl per tjänst. Frågan ställs en gång, men motiveringarna redovisas var för sig. */}
      <ul className="mt-3 grid gap-2">
        {field.reasons.map((r) => (
          <li key={r.providerName} className="text-sm">
            <span className="text-xs uppercase tracking-[0.09em] text-stem">{r.providerName}</span>
            <span className="mt-0.5 block text-stem">{r.reason}</span>
          </li>
        ))}
      </ul>

      <label htmlFor={inputId} className="sr-only">
        {field.label}
      </label>
      <input
        id={inputId}
        type={field.inputType}
        value={value}
        placeholder={field.placeholder ?? ""}
        autoComplete={field.autoComplete ?? "off"}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className="mt-4 w-full rounded-xl border border-[var(--color-line)] bg-ring px-4 py-3 text-ink outline-none focus:border-blue-deep"
      />

      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-sm text-stem" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
