import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const NewClaim = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const billId = params.get("bill_id");

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"insurance" | "scheme" | "hospital_dispute">("insurance");
  const [insurer, setInsurer] = useState("");
  const [scheme, setScheme] = useState("");
  const [policy, setPolicy] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!billId) return;
    supabase
      .from("bills")
      .select("hospital_name, potential_savings, total_billed")
      .eq("id", billId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setTitle(`Claim — ${data.hospital_name || "Hospital bill"}`);
        if (data.potential_savings) setAmount(String(data.potential_savings));
      });
  }, [billId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("claims")
      .insert({
        user_id: user.id,
        bill_id: billId,
        title: title || "New claim",
        kind,
        insurer_name: kind === "insurance" ? insurer || null : null,
        scheme_name: kind === "scheme" ? scheme || null : null,
        policy_number: policy || null,
        amount_claimed: amount ? Number(amount) : null,
        notes: notes || null,
        status: "draft",
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate(`/claims/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-2xl py-8 md:py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">New claim</h1>
        <p className="mt-1 text-muted-foreground">A claim is one ongoing case — insurance reimbursement, scheme application, or hospital bill dispute.</p>

        <form onSubmit={handleSave} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Apollo Hospital — surgery dispute" required />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v: typeof kind) => setKind(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="insurance">Insurance reimbursement</SelectItem>
                <SelectItem value="scheme">Government scheme</SelectItem>
                <SelectItem value="hospital_dispute">Hospital bill dispute</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "insurance" && (
            <div>
              <Label htmlFor="ins">Insurer / TPA</Label>
              <Input id="ins" value={insurer} onChange={(e) => setInsurer(e.target.value)} placeholder="e.g. Star Health, HDFC ERGO" />
            </div>
          )}
          {kind === "scheme" && (
            <div>
              <Label htmlFor="sch">Scheme</Label>
              <Input id="sch" value={scheme} onChange={(e) => setScheme(e.target.value)} placeholder="e.g. Ayushman Bharat — PMJAY" />
            </div>
          )}
          <div>
            <Label htmlFor="pol">Policy / Card / Reference number</Label>
            <Input id="pol" value={policy} onChange={(e) => setPolicy(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="amt">Amount claimed (₹)</Label>
            <Input id="amt" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full bg-gradient-hero shadow-elegant" disabled={saving}>
            {saving ? "Saving…" : "Create claim"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default NewClaim;