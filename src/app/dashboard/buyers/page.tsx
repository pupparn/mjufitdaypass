import { ChevronRight, Download, X } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireArea } from "@/lib/auth/viewer";
import { BUYER_STATUSES, buyerQuery, parseBuyerFilter } from "@/lib/buyer-filter";
import { loadBuyers } from "@/lib/buyers";
import { FACULTIES, YEARS_OF_STUDY } from "@/lib/registration";
import { formatBaht } from "@/lib/sales";
import { dmy } from "@/lib/time";
import { th } from "@/messages/th";
import { DateField } from "./date-field";

const LIMIT = 200;
const SELECT = "h-9 rounded-md border border-input bg-transparent px-2 text-sm";
const BADGE = "rounded-full px-2 py-0.5 text-xs font-medium";
// Status badges; pending/expired (only reachable by search) stay muted.
const STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  needs_review: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  rejected: "bg-destructive/10 text-destructive",
};
const MUTED_BADGE = "bg-muted text-muted-foreground";
const REFUND_DUE = "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300";
const REFUNDED = "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300";

export default async function BuyersPage({ searchParams }: PageProps<"/dashboard/buyers">) {
  await requireArea("staff");
  const f = parseBuyerFilter(await searchParams);
  const { rows, total } = await loadBuyers(f, LIMIT);
  const query = buyerQuery(f);
  const here = `/dashboard/buyers${query && `?${query}`}`;
  const b = th.staff.buyers;
  // A drill-down can carry a faculty outside today's list (the DB doesn't constrain it).
  const faculties: readonly string[] = f.faculty && !(FACULTIES as readonly string[]).includes(f.faculty) ? [...FACULTIES, f.faculty] : FACULTIES;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 pb-8">
      <h2 className="text-xl font-semibold">{f.status === "all" ? b.title : b.statuses[f.status]}</h2>
      {/* key: client navigation reuses this form, so remount it to pick up the new defaults */}
      <form key={query} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input name="q" defaultValue={f.q} placeholder={b.search} />
          <Button type="submit">{b.filter}</Button>
          {query && (
            <Link href="/dashboard/buyers" className={buttonVariants({ variant: "outline" })}>
              <X />
              {b.clear}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select name="status" defaultValue={f.status} className={SELECT} aria-label={th.staff.order.status}>
            {BUYER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {b.statuses[s]}
              </option>
            ))}
          </select>
          <select name="faculty" defaultValue={f.faculty} className={`${SELECT} max-w-56`} aria-label={b.allFaculties}>
            <option value="">{b.allFaculties}</option>
            {faculties.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <select name="year" defaultValue={f.year} className={SELECT} aria-label={b.allYears}>
            <option value="">{b.allYears}</option>
            {YEARS_OF_STUDY.map((y) => (
              <option key={y} value={y}>
                {th.staff.stats.year(String(y))}
              </option>
            ))}
          </select>
          <DateField name="from" label={b.from} defaultValue={f.from} className={SELECT} />
          <DateField name="to" label={b.to} defaultValue={f.to} className={SELECT} />
          <Link
            href={`/dashboard/buyers/export${query && `?${query}`}`}
            prefetch={false}
            className={`${buttonVariants({ variant: "outline" })} ml-auto border-foreground/30`}
          >
            <Download />
            {b.export}
          </Link>
        </div>
      </form>
      {total > 0 && <p className="text-sm text-muted-foreground">{b.found(total)}</p>}
      <Card>
        <CardContent className="flex flex-col gap-2 pt-4">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">{b.empty}</p>}
          {rows.map((r) => (
            // The order link's ::after covers the card, so a click anywhere opens it; the student ID link sits above.
            <div
              key={r.id}
              className="relative flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 has-[>a:focus-visible]:ring-3 has-[>a:focus-visible]:ring-ring/50"
            >
              <div className="flex flex-col gap-1">
                <p>
                  <Link
                    href={`/dashboard/buyers?${buyerQuery({ q: r.profiles?.student_id ?? "" })}`}
                    className="relative z-10 font-medium underline-offset-2 hover:underline"
                  >
                    {r.profiles?.student_id}
                  </Link>{" "}
                  {r.profiles?.first_name} {r.profiles?.last_name}
                </p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                  {dmy(r.business_date)} · {formatBaht(r.amount_satang)} บาท
                  <span className={`${BADGE} ${STATUS_BADGE[r.status] ?? MUTED_BADGE}`}>{th.staff.order.statuses[r.status]}</span>
                  {r.refund_required && !r.refunded_at && <span className={`${BADGE} ${REFUND_DUE}`}>{b.refundDue}</span>}
                  {r.refunded_at && <span className={`${BADGE} ${REFUNDED}`}>{b.refunded}</span>}
                  {r.review_reason && r.status !== "paid" && <span>{th.order.reviewReasons[r.review_reason] ?? r.review_reason}</span>}
                </p>
              </div>
              <Link
                href={`/dashboard/orders/${r.id}?back=${encodeURIComponent(here)}`}
                aria-label={`${th.staff.queue.open} ${r.profiles?.student_id ?? ""}`}
                className="text-muted-foreground outline-none after:absolute after:inset-0 after:rounded-lg"
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
          ))}
          {total > rows.length && <p className="text-xs text-muted-foreground">{b.limit}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
