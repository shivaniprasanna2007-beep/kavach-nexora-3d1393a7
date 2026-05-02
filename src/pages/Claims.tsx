import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, FileText, BookOpen, Bell } from "lucide-react";
import { formatINR } from "@/lib/format";

type Claim = {
  id: string;
  title: string;
  kind: string;
  status: string;
  insurer_name: string | null;
  scheme_name: string | null;
  amount_claimed: number | null;
  amount_approved: number | null;
  created_at: string;
};

const Claims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("claims")
      .select("id, title, kind, status, insurer_name, scheme_name, amount_claimed, amount_approved, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setClaims((data as Claim[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Claims</h1>
            <p className="mt-1 text-muted-foreground">Track every insurance, scheme and dispute case in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/schemes"><BookOpen className="mr-2 h-4 w-4" /> Scheme guide</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/reminders"><Bell className="mr-2 h-4 w-4" /> Reminders</Link>
            </Button>
            <Button asChild className="bg-gradient-hero shadow-elegant">
              <Link to="/claims/new"><Plus className="mr-2 h-4 w-4" /> New claim</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">Loading…</div>
          ) : claims.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-3 font-display text-lg font-semibold">No claims yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start a claim from a bill or create one manually.</p>
              <Button asChild className="mt-4 bg-gradient-hero">
                <Link to="/claims/new">Start a claim</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {claims.map((c) => (
                <Link
                  key={c.id}
                  to={`/claims/${c.id}`}
                  className="group rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-all hover:border-primary/40 hover:shadow-elegant"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.kind.replace("_", " ")}</div>
                      <h3 className="mt-1 font-display text-base font-semibold">{c.title}</h3>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {c.insurer_name || c.scheme_name || "—"}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <StatusBadge status={c.status} />
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Claimed</div>
                      <div className="font-display font-semibold">{formatINR(c.amount_claimed ?? 0)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const cls: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-primary/10 text-primary",
    in_review: "bg-accent/15 text-accent-foreground",
    approved: "bg-secondary/15 text-secondary",
    rejected: "bg-destructive/10 text-destructive",
    paid: "bg-secondary/20 text-secondary",
    closed: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${cls[status] ?? "bg-muted"}`}>
      {status.replace("_", " ")}
    </span>
  );
};

export default Claims;