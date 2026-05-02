import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { ScanSearch, FileSearch, IndianRupee, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { icon: ScanSearch, label: "Reading your bill" },
  { icon: FileSearch, label: "Auditing line items" },
  { icon: IndianRupee, label: "Finding savings & schemes" },
];

const Processing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const triggered = useRef(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!id || triggered.current) return;
    triggered.current = true;

    let cancelled = false;
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }, 4000);

    (async () => {
      const { data, error } = await supabase.functions.invoke("audit-bill", {
        body: { bill_id: id },
      });
      if (cancelled) return;
      clearInterval(stepTimer);
      if (error) {
        const msg = (error as { message?: string }).message || "Audit failed";
        toast.error(msg);
        navigate(`/bill/${id}`);
        return;
      }
      if (data?.error) {
        toast.error(String(data.error));
        navigate(`/bill/${id}`);
        return;
      }
      navigate(`/bill/${id}`);
    })();

    return () => {
      cancelled = true;
      clearInterval(stepTimer);
    };
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container flex max-w-xl flex-col items-center py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero shadow-elegant">
          <Loader2 className="h-7 w-7 animate-spin text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold">KAVACH is auditing your bill…</h1>
        <p className="mt-2 text-sm text-muted-foreground">This usually takes 10–30 seconds. Don't close this page.</p>

        <ul className="mt-10 w-full space-y-3 text-left">
          {STEPS.map((s, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <li
                key={s.label}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                  done ? "border-secondary/30 bg-secondary/5" : active ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${done ? "bg-secondary/15 text-secondary" : active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {active ? <Loader2 className="h-4 w-4 animate-spin" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className="font-medium">{s.label}</span>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
};

export default Processing;