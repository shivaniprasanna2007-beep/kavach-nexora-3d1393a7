import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import StatusPipeline from "@/components/StatusPipeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Sparkles, Trash2, Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import { StatusBadge } from "./Claims";

type Claim = {
  id: string;
  bill_id: string | null;
  title: string;
  kind: "insurance" | "scheme" | "hospital_dispute";
  status: "draft" | "submitted" | "in_review" | "approved" | "rejected" | "paid" | "closed";
  insurer_name: string | null;
  scheme_name: string | null;
  policy_number: string | null;
  claim_number: string | null;
  amount_claimed: number | null;
  amount_approved: number | null;
  submitted_at: string | null;
  decided_at: string | null;
  notes: string | null;
};

type Doc = {
  id: string;
  kind: string;
  title: string;
  content: string | null;
  created_at: string;
};

const STATUSES: Claim["status"][] = ["draft", "submitted", "in_review", "approved", "rejected", "paid", "closed"];

const ClaimDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("Follow up with insurer");
  const [reminderDate, setReminderDate] = useState("");

  const load = async () => {
    if (!id) return;
    const [{ data: c }, { data: d }] = await Promise.all([
      supabase.from("claims").select("*").eq("id", id).maybeSingle(),
      supabase.from("claim_documents").select("id, kind, title, content, created_at").eq("claim_id", id).order("created_at", { ascending: false }),
    ]);
    setClaim(c as Claim | null);
    setDocs((d as Doc[]) ?? []);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: Claim["status"]) => {
    if (!claim) return;
    const today = new Date().toISOString().slice(0, 10);
    const patch: {
      status: Claim["status"];
      submitted_at?: string;
      decided_at?: string;
    } = { status };
    if (status === "submitted" && !claim.submitted_at) patch.submitted_at = today;
    if (["approved", "rejected", "paid"].includes(status) && !claim.decided_at) patch.decided_at = today;
    const { error } = await supabase.from("claims").update(patch).eq("id", claim.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status updated");
    load();
  };

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim) return;
    setSaving(true);
    const { error } = await supabase
      .from("claims")
      .update({
        claim_number: claim.claim_number,
        amount_claimed: claim.amount_claimed,
        amount_approved: claim.amount_approved,
        notes: claim.notes,
      })
      .eq("id", claim.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const generateLetter = async () => {
    if (!claim?.bill_id) {
      toast.error("Link this claim to a bill first to generate a dispute letter");
      return;
    }
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-dispute-letter", {
      body: { bill_id: claim.bill_id, claim_id: claim.id },
    });
    setGenerating(false);
    if (error || data?.error) {
      toast.error(data?.error || (error as { message?: string })?.message || "Could not generate letter");
      return;
    }
    toast.success("Dispute letter ready");
    load();
  };

  const addReminder = async () => {
    if (!user || !claim) return;
    if (!reminderDate) {
      toast.error("Pick a date");
      return;
    }
    const { error } = await supabase.from("reminders").insert({
      user_id: user.id,
      claim_id: claim.id,
      bill_id: claim.bill_id,
      title: reminderTitle || "Follow up",
      due_at: new Date(reminderDate).toISOString(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Reminder added");
      setReminderDate("");
    }
  };

  const deleteClaim = async () => {
    if (!claim) return;
    if (!confirm("Delete this claim and all linked documents?")) return;
    const { error } = await supabase.from("claims").delete().eq("id", claim.id);
    if (error) toast.error(error.message);
    else navigate("/claims");
  };

  if (!claim) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-12 text-center text-muted-foreground">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <Link to="/claims" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All claims
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{claim.kind.replace("_", " ")}</div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{claim.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={claim.status} />
              {claim.bill_id && (
                <Link to={`/bill/${claim.bill_id}`} className="text-xs text-primary hover:underline">View bill →</Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={claim.status} onValueChange={(v) => updateStatus(v as Claim["status"])}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={deleteClaim}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            {/* Documents */}
            <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Documents & letters</h2>
                <Button size="sm" onClick={generateLetter} disabled={generating || !claim.bill_id} className="bg-gradient-hero">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generating ? "Generating…" : "Generate dispute letter"}
                </Button>
              </div>
              {!claim.bill_id && (
                <p className="mt-2 text-xs text-muted-foreground">Link this claim to a bill to enable AI dispute letters.</p>
              )}
              <div className="mt-4 space-y-3">
                {docs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents yet.</p>
                ) : (
                  docs.map((d) => (
                    <details key={d.id} className="rounded-xl border border-border/60 bg-background p-4">
                      <summary className="flex cursor-pointer items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">{d.title}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{d.kind.replace("_", " ")}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                      </summary>
                      {d.content && (
                        <>
                          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">{d.content}</pre>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(d.content!); toast.success("Copied"); }}>Copy</Button>
                            <Button size="sm" variant="outline" onClick={() => downloadText(d.title + ".txt", d.content!)}>Download .txt</Button>
                          </div>
                        </>
                      )}
                    </details>
                  ))
                )}
              </div>
            </section>

            {/* Details form */}
            <form onSubmit={saveDetails} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Details</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Claim number</Label>
                  <Input value={claim.claim_number ?? ""} onChange={(e) => setClaim({ ...claim, claim_number: e.target.value })} />
                </div>
                <div>
                  <Label>Amount claimed (₹)</Label>
                  <Input type="number" value={claim.amount_claimed ?? ""} onChange={(e) => setClaim({ ...claim, amount_claimed: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <Label>Amount approved (₹)</Label>
                  <Input type="number" value={claim.amount_approved ?? ""} onChange={(e) => setClaim({ ...claim, amount_approved: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea rows={3} value={claim.notes ?? ""} onChange={(e) => setClaim({ ...claim, notes: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="mt-4" disabled={saving}>{saving ? "Saving…" : "Save details"}</Button>
            </form>
          </div>

          <div className="space-y-6">
            <StatusPipeline status={claim.status} />

            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold">Add reminder</h3>
              </div>
              <div className="mt-3 space-y-2">
                <Input placeholder="What to remember" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} />
                <Input type="datetime-local" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
                <Button size="sm" onClick={addReminder} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add reminder</Button>
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Summary</div>
              <div className="mt-3 space-y-2">
                <Row label="Claimed" value={formatINR(claim.amount_claimed ?? 0)} />
                <Row label="Approved" value={claim.amount_approved != null ? formatINR(claim.amount_approved) : "—"} />
                <Row label="Submitted" value={claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : "—"} />
                <Row label="Decided" value={claim.decided_at ? new Date(claim.decided_at).toLocaleDateString() : "—"} />
                <Row label="Insurer / scheme" value={claim.insurer_name || claim.scheme_name || "—"} />
                <Row label="Policy / card" value={claim.policy_number || "—"} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const downloadText = (name: string, body: string) => {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

export default ClaimDetail;