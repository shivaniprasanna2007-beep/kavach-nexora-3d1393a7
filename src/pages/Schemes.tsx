import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCHEMES, buildVars, type SchemeGuide } from "@/lib/schemes";
import { BookOpen, FileText, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Schemes = () => {
  const [active, setActive] = useState<SchemeGuide | null>(null);

  if (active) return <SchemeDetail scheme={active} onBack={() => setActive(null)} />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Scheme & claim guide</h1>
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Step-by-step filing guides and ready-to-customize claim letters for India's major health schemes and insurance reimbursements.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {SCHEMES.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className="group rounded-2xl border border-border/60 bg-card p-6 text-left shadow-soft transition-all hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.short}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

const SchemeDetail = ({ scheme, onBack }: { scheme: SchemeGuide; onBack: () => void }) => {
  const [vars, setVars] = useState(() =>
    buildVars({ todayDate: new Date().toLocaleDateString("en-IN") }),
  );
  const letter = scheme.letterTemplate(vars);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All schemes
        </button>
        <h1 className="font-display text-3xl font-bold tracking-tight">{scheme.name}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{scheme.description}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Eligibility</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {scheme.eligibility.map((e, i) => <Bullet key={i}>{e}</Bullet>)}
            </ul>
          </section>
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Documents needed</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {scheme.documents.map((e, i) => <Bullet key={i}>{e}</Bullet>)}
            </ul>
          </section>
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
            <h2 className="font-display text-lg font-semibold">How to file</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {scheme.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Claim letter — fill in your details</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {([
              ["patientName", "Patient name"],
              ["hospitalName", "Hospital"],
              ["billNumber", "Bill number"],
              ["billDate", "Bill date"],
              ["amountClaimed", "Amount (₹)"],
              ["policyOrId", "Policy / Card / ID number"],
              ["contact", "Phone / email"],
            ] as const).map(([k, label]) => (
              <div key={k}>
                <Label className="text-xs">{label}</Label>
                <Input value={vars[k]} onChange={(e) => setVars({ ...vars, [k]: e.target.value })} />
              </div>
            ))}
          </div>

          <pre className="mt-5 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl bg-muted/40 p-5 text-sm leading-relaxed">{letter}</pre>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => { navigator.clipboard.writeText(letter); toast.success("Letter copied"); }}>Copy letter</Button>
            <Button variant="outline" onClick={() => download(`${scheme.id}-letter.txt`, letter)}>Download .txt</Button>
          </div>
        </section>
      </main>
    </div>
  );
};

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2">
    <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
    <span>{children}</span>
  </li>
);

const download = (name: string, body: string) => {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

export default Schemes;