import { Link } from "react-router-dom";
import { ShieldCheck, ScanSearch, FileSearch, IndianRupee, Sparkles, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import heroImg from "@/assets/hero-kavach.jpg";
import { LANGUAGES } from "@/lib/languages";

const features = [
  { icon: ScanSearch, title: "Smart bill scan", desc: "Snap a photo or upload a PDF. We OCR every line item — even handwritten ones." },
  { icon: FileSearch, title: "AI audit in seconds", desc: "Detect overcharges, duplicates and unnecessary items against fair market rates." },
  { icon: IndianRupee, title: "Find your savings", desc: "See exactly how much you can recover and which government schemes you qualify for." },
  { icon: Languages, title: "Your language", desc: "Reports in English, Hindi, Tamil, Telugu, Bengali and more." },
];

const testimonials = [
  { quote: "Saved ₹47,000 on my mother's surgery bill. KAVACH spotted four duplicate charges.", name: "Rohan M.", role: "Mumbai" },
  { quote: "Finally understood our insurance claim. The dispute letter draft was a lifesaver.", name: "Priya S.", role: "Bengaluru" },
  { quote: "Found out we were eligible for PMJAY. We didn't even know.", name: "Anil K.", role: "Lucknow" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container relative grid gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI hospital bill auditor
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Don't pay a rupee more than you owe.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              KAVACH turns confusing hospital bills into clear, actionable financial recovery plans —
              detecting overcharges, government scheme eligibility, and insurance claim opportunities in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="bg-gradient-hero shadow-elegant">
                <Link to="/signup">Audit my bill — free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>

            <div className="mt-8">
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Available in</div>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((l) => (
                  <span key={l.code} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-trust opacity-20 blur-2xl" />
            <img
              src={heroImg}
              alt="Family reviewing hospital bill audit on tablet"
              className="rounded-2xl shadow-elegant"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 md:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Built for real Indian families</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          From a 2-page chemist receipt to a 40-page surgery bill — KAVACH reads it, audits it and tells you what to do next.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition-shadow hover:shadow-elegant"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-gradient-trust py-12 text-primary-foreground">
        <div className="container grid gap-8 text-center md:grid-cols-3">
          <Stat value="₹38L+" label="Overcharges detected" />
          <Stat value="12,000+" label="Bills audited" />
          <Stat value="4.9 ★" label="Average user rating" />
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-16 md:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">What patients say</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              <blockquote className="mt-3 text-base leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{t.name}</span> · {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} KAVACH · Hospital bills, decoded.</div>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-foreground">Login</Link>
            <Link to="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div className="font-display text-4xl font-bold md:text-5xl">{value}</div>
    <div className="mt-1 text-sm opacity-90">{label}</div>
  </div>
);

export default Index;
