"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const box = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const iso = parseDmy(text);
  const invalid = text !== "" && !iso;

  // An unreadable date would submit as "no date filter" while still showing in the box, so block the submit instead.
  useEffect(() => {
    box.current?.setCustomValidity(invalid ? th.staff.buyers.dateInvalid : "");
  }, [invalid]);

  // Re-formatting moves the caret to the end; put it back after the digit it was on.
  useLayoutEffect(() => {
    if (caret.current === null) return;
    box.current?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [text]);

  function type(el: HTMLInputElement) {
    const next = withSlashes(el.value);
    const digitsBefore = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/\D/g, "").length;
    let pos = 0;
    for (let seen = 0; pos < next.length && seen < digitsBefore; pos++) if (next[pos] !== "/") seen++;
    caret.current = pos;
    setText(next);
  }

  return (
    <label className="flex items-center gap-1">
      {label}
      <span className="relative flex items-center">
        <input
          ref={box}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={th.staff.buyers.datePlaceholder}
          value={text}
          onChange={(e) => type(e.target)}
          aria-invalid={invalid}
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
