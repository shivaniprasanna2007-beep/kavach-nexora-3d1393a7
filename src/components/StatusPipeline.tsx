import { CheckCircle2, Circle, XCircle } from "lucide-react";

const ORDER: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
];

const StatusPipeline = ({ status }: { status: string }) => {
  const rejected = status === "rejected";
  const closed = status === "closed";
  const idx = ORDER.findIndex((s) => s.value === status);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">Claim progress</h3>
        {rejected && <span className="text-xs font-medium text-destructive">Rejected</span>}
        {closed && <span className="text-xs font-medium text-muted-foreground">Closed</span>}
      </div>
      <ol className="grid gap-2">
        {ORDER.map((s, i) => {
          const done = !rejected && idx > i;
          const active = !rejected && idx === i;
          return (
            <li key={s.value} className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center">
                {rejected && i === 0 ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : done ? (
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                ) : active ? (
                  <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className={`text-sm ${active ? "font-semibold text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default StatusPipeline;