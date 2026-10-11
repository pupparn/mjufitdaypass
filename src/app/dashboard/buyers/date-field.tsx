"use client";

import { CalendarDays } from "lucide-react";
import { useRef, useState } from "react";
import { dmy, parseDmy } from "@/lib/time";
import { th } from "@/messages/th";

/** Types digits only; the slashes fill themselves in: "05102026" → "05/10/2026". */
function withSlashes(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
}

/**
 * Date filter shown as dd/mm/yyyy. A native date input follows the browser's locale
 * (often mm/dd/yyyy), so the visible box is text and the form submits a hidden ISO value.
 */
export function DateField({ name, label, defaultValue, className }: { name: string; label: string; defaultValue: string; className?: string }) {
  const [text, setText] = useState(defaultValue && dmy(defaultValue));
  const picker = useRef<HTMLInputElement>(null);
  const iso = parseDmy(text);

  return (
    <label className="flex items-center gap-1">
      {label}
      <span className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={th.staff.buyers.datePlaceholder}
          value={text}
          onChange={(e) => setText(withSlashes(e.target.value))}
          aria-invalid={text !== "" && !iso}
          className={`${className} w-36 pr-8 aria-invalid:border-destructive`}
        />
        <input type="hidden" name={name} value={iso} />
        <button
          type="button"
          onClick={() => picker.current?.showPicker()}
          aria-label={`${th.staff.buyers.pickDate} (${label})`}
          className="absolute right-1 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <CalendarDays className="size-4" />
        </button>
        {/* Only here to lend its calendar popup to the button above. */}
        <input
          ref={picker}
          type="date"
          tabIndex={-1}
          aria-hidden
          value={iso}
          onChange={(e) => setText(e.target.value && dmy(e.target.value))}
          className="pointer-events-none absolute bottom-0 left-0 size-0 opacity-0"
        />
      </span>
    </label>
  );
}
