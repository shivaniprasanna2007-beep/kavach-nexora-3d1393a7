import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import SEO from "@/components/SEO";
import { formatINR } from "@/lib/format";
import { IndianRupee, FileText, ShieldCheck, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Bill = {
  id: string;
  total_billed: number | null;
  total_overcharge: number | null;
  potential_savings: number | null;
  created_at: string;
  status: string;
};

type Claim = {
  status: string;
  amount_claimed: number | null;
  amount_approved: number | null;
};

const Analytics = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("bills").select("id, total_billed, total_overcharge, potential_savings, created_at, status").order("created_at"),
      supabase.from("claims").select("status, amount_claimed, amount_approved"),
    ]).then(([b, c]) => {
      setBills((b.data as Bill[]) ?? []);
      setClaims((c.data as Claim[]) ?? []);
      setLoading(false);
    });
  }, [user]);

  const totalBilled = bills.reduce((s, b) => s + (b.total_billed ?? 0), 0);
  const totalSavings = bills.reduce((s, b) => s + (b.potential_savings ?? 0), 0);
  const totalRecovered = claims.reduce((s, c) => s + (c.amount_approved ?? 0), 0);
  const recoveryRate = totalBilled > 0 ? Math.round((totalSavings / totalBilled) * 100) : 0;

  // monthly aggregation
  const byMonth: Record<string, { month: string; billed: number; savings: number }> = {};
  bills.forEach((b) => {
    const d = new Date(b.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    byMonth[key] = byMonth[key] || { month: label, billed: 0, savings: 0 };
    byMonth[key].billed += b.total_billed ?? 0;
    byMonth[key].savings += b.potential_savings ?? 0;
  });
  const monthly = Object.entries(byMonth)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, v]) => v)
    .slice(-6);

  const claimStatusData = Object.entries(
    claims.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const pieColors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))", "hsl(var(--primary-glow))"];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Analytics · KAVACH" description="See your savings, audited bills and claim recovery rate over time." />
      <AppHeader />
      <main className="container py-8 md:py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Your analytics</h1>
        <p className="mt-1 text-muted-foreground">A clear picture of every rupee KAVACH has helped you protect.</p>

        {loading ? (
          <div className="mt-10 rounded-2xl border bg-card p-10 text-center text-muted-foreground">Loading your numbers…</div>
        ) : bills.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
            Upload your first bill to start seeing analytics.
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <Stat icon={FileText} label="Bills audited" value={String(bills.length)} />
              <Stat icon={IndianRupee} label="Total billed" value={formatINR(totalBilled)} />
              <Stat icon={ShieldCheck} label="Potential savings" value={formatINR(totalSavings)} highlight />
              <Stat icon={TrendingUp} label="Recovery rate" value={`${recoveryRate}%`} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <ChartCard title="Billed vs savings (last 6 months)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(v: number) => formatINR(v)}
                    />
                    <Legend />
                    <Bar dataKey="billed" fill="hsl(var(--primary))" name="Billed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="savings" fill="hsl(var(--secondary))" name="Savings" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Claims by status">
                {claimStatusData.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                    No claims yet. Start one from a bill.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={claimStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                        {claimStatusData.map((_, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <InfoTile label="Recovered from insurers" value={formatINR(totalRecovered)} sub="Sum of approved claim amounts" />
              <InfoTile label="Active claims" value={String(claims.filter((c) => !["paid", "closed", "rejected"].includes(c.status)).length)} sub="In draft, submitted, or under review" />
            </div>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, highlight }: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-2xl border p-5 shadow-soft ${highlight ? "border-secondary/40 bg-secondary/5" : "border-border/60 bg-card"}`}>
    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${highlight ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary"}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 font-display text-2xl font-bold">{value}</div>
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
    <h2 className="mb-4 font-display text-base font-semibold">{title}</h2>
    {children}
  </div>
);

const InfoTile = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="rounded-2xl border border-border/60 bg-card p-5">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
  </div>
);

export default Analytics;