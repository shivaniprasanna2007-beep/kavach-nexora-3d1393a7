import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, CheckCircle2, IndianRupee, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/format";

type Bill = {
  id: string;
  hospital_name: string | null;
  patient_name: string | null;
  bill_date: string | null;
  bill_number: string | null;
  total_billed: number | null;
  total_fair: number | null;
  total_overcharge: number | null;
  potential_savings: number | null;
  audit_summary: string | null;
  status: string;
  error_message: string | null;
};

type Item = {
  id: string;
  description: string;
  category: string | null;
  quantity: number | null;
  amount: number | null;
  fair_price: number | null;
  overcharge: number | null;
  is_overcharged: boolean;
  notes: string | null;
};

type Finding = {
  id: string;
  kind: string;
  severity: string;
  title: string;
  description: string | null;
  estimated_savings: number | null;
  recommended_action: string | null;
};

const BillDetail = () => {
  const { id } = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: b }, { data: it }, { data: fd }] = await Promise.all([
        supabase.from("bills").select("*").eq("id", id).maybeSingle(),
        supabase.from("bill_items").select("*").eq("bill_id", id).order("amount", { ascending: false }),
        supabase.from("audit_findings").select("*").eq("bill_id", id).order("severity", { ascending: false }),
      ]);
      setBill(b as Bill | null);
      setItems((it as Item[]) ?? []);
      setFindings((fd as Finding[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-12 text-center text-muted-foreground">Loading…</main>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-12">Bill not found.</main>
      </div>
    );
  }

  const failed = bill.status === "failed";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {bill.hospital_name || "Hospital bill"}
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {bill.patient_name && <>Patient: {bill.patient_name} · </>}
              {bill.bill_date && <>Date: {new Date(bill.bill_date).toLocaleDateString()} · </>}
              {bill.bill_number && <>#{bill.bill_number}</>}
            </div>
          </div>
        </div>

        {failed && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <div className="font-medium text-destructive">Audit failed</div>
              <div className="text-muted-foreground">{bill.error_message || "Please try uploading again."}</div>
            </div>
          </div>
        )}

        {/* Summary */}
        {bill.audit_summary && (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-6 shadow-soft">
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> KAVACH summary
            </div>
            <p className="text-base leading-relaxed text-foreground/90">{bill.audit_summary}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Kpi label="Billed" value={formatINR(bill.total_billed)} />
          <Kpi label="Fair value" value={formatINR(bill.total_fair)} />
          <Kpi label="Overcharge" value={formatINR(bill.total_overcharge)} tone="warning" />
          <Kpi label="Potential savings" value={formatINR(bill.potential_savings)} tone="success" />
        </div>

        {/* Findings */}
        {findings.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Key findings</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {findings.map((f) => (
                <div key={f.id} className="rounded-xl border border-border/60 bg-card p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SeverityDot severity={f.severity} />
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{f.kind.replace("_", " ")}</span>
                    </div>
                    {f.estimated_savings ? (
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">
                        +{formatINR(f.estimated_savings)}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold">{f.title}</h3>
                  {f.description && <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>}
                  {f.recommended_action && (
                    <p className="mt-3 text-sm">
                      <span className="font-medium text-primary">Action:</span> {f.recommended_action}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Line items */}
        {items.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Line items</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
              <div className="grid grid-cols-12 gap-2 border-b border-border/60 bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="col-span-6">Item</div>
                <div className="col-span-2 text-right">Billed</div>
                <div className="col-span-2 text-right">Fair</div>
                <div className="col-span-2 text-right">Overcharge</div>
              </div>
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-12 gap-2 border-b border-border/60 px-4 py-3 text-sm last:border-0">
                  <div className="col-span-6">
                    <div className="flex items-center gap-2">
                      {it.is_overcharged ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                      )}
                      <span className="font-medium">{it.description}</span>
                    </div>
                    {it.notes && <div className="mt-0.5 text-xs text-muted-foreground">{it.notes}</div>}
                  </div>
                  <div className="col-span-2 text-right">{formatINR(it.amount)}</div>
                  <div className="col-span-2 text-right text-muted-foreground">
                    {it.fair_price != null ? formatINR(it.fair_price) : "—"}
                  </div>
                  <div className={`col-span-2 text-right font-medium ${it.is_overcharged ? "text-warning" : "text-muted-foreground"}`}>
                    {it.overcharge ? formatINR(it.overcharge) : "—"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!failed && items.length === 0 && findings.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <IndianRupee className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No structured audit data yet. The bill may still be processing.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/upload">Upload another bill</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

const Kpi = ({ label, value, tone }: { label: string; value: string; tone?: "warning" | "success" }) => (
  <div
    className={`rounded-2xl border p-5 shadow-soft ${
      tone === "success"
        ? "border-secondary/30 bg-secondary/5"
        : tone === "warning"
          ? "border-warning/30 bg-warning/5"
          : "border-border/60 bg-card"
    }`}
  >
    <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    <div
      className={`mt-1 font-display text-2xl font-bold ${
        tone === "success" ? "text-secondary" : tone === "warning" ? "text-warning" : ""
      }`}
    >
      {value}
    </div>
  </div>
);

const SeverityDot = ({ severity }: { severity: string }) => {
  const cls =
    severity === "high"
      ? "bg-destructive"
      : severity === "medium"
        ? "bg-warning"
        : severity === "low"
          ? "bg-primary"
          : "bg-muted-foreground";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
};

export default BillDetail;