import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/format";

type Bill = {
  id: string;
  hospital_name: string | null;
  total_billed: number | null;
  potential_savings: number | null;
  status: string;
  created_at: string;
};

const History = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("bills")
      .select("id, hospital_name, total_billed, potential_savings, status, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBills((data as Bill[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">All bills</h1>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No bills yet.</div>
          ) : (
            bills.map((b, i) => (
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
                    {new Date(b.created_at).toLocaleDateString()} · <span className="capitalize">{b.status}</span>
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
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default History;