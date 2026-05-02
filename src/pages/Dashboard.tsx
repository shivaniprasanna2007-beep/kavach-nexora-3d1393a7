import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import { Upload, FileText, IndianRupee, ShieldCheck, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/format";

type Bill = {
  id: string;
  hospital_name: string | null;
  total_billed: number | null;
  potential_savings: number | null;
  status: string;
  created_at: string;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bills")
      .select("id, hospital_name, total_billed, potential_savings, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setBills((data as Bill[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const totalSavings = bills.reduce((s, b) => s + (b.potential_savings ?? 0), 0);
  const totalAudited = bills.filter((b) => b.status === "audited").length;
  const totalBilled = bills.reduce((s, b) => s + (b.total_billed ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Your dashboard</h1>
            <p className="mt-1 text-muted-foreground">Track every bill, every saving, every claim.</p>
          </div>
          <Button asChild size="lg" className="bg-gradient-hero shadow-elegant">
            <Link to="/upload">
              <Upload className="mr-2 h-4 w-4" /> Audit a new bill
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard icon={FileText} label="Bills audited" value={String(totalAudited)} />
          <StatCard icon={IndianRupee} label="Total billed" value={formatINR(totalBilled)} />
          <StatCard icon={ShieldCheck} label="Potential savings" value={formatINR(totalSavings)} highlight />
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recent bills</h2>
            <Link to="/history" className="text-sm text-primary hover:underline">View all</Link>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">Loading…</div>
          ) : bills.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
              {bills.map((b, i) => (
                <Link
                  key={b.id}
                  to={`/bill/${b.id}`}
                  className={`flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40 ${
                    i > 0 ? "border-t border-border/60" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{b.hospital_name || "Hospital bill"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString()} · <StatusPill status={b.status} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-semibold">{formatINR(b.total_billed ?? 0)}</div>
                    {b.potential_savings ? (
                      <div className="text-xs text-secondary">Save {formatINR(b.potential_savings)}</div>
                    ) : null}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-2xl border p-6 shadow-soft ${
      highlight ? "border-secondary/40 bg-secondary/5" : "border-border/60 bg-card"
    }`}
  >
    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${highlight ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary"}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="mt-1 font-display text-2xl font-bold">{value}</div>
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    audited: "text-secondary",
    processing: "text-accent",
    uploaded: "text-muted-foreground",
    failed: "text-destructive",
  };
  return <span className={`font-medium capitalize ${map[status] ?? ""}`}>{status}</span>;
};

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Upload className="h-6 w-6" />
    </div>
    <h3 className="font-display text-lg font-semibold">No bills yet</h3>
    <p className="mt-1 text-sm text-muted-foreground">Upload your first hospital bill to see KAVACH in action.</p>
    <Button asChild className="mt-4 bg-gradient-hero">
      <Link to="/upload">Upload a bill</Link>
    </Button>
  </div>
);

export default Dashboard;