import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Check, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  due_at: string;
  done_at: string | null;
  sent_at: string | null;
  claim_id: string | null;
};

const Reminders = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("reminders")
      .select("id, title, description, due_at, done_at, sent_at, claim_id")
      .order("due_at", { ascending: true });
    setItems((data as Reminder[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!user) return;
    if (!title || !date) {
      toast.error("Title and date are required");
      return;
    }
    const { error } = await supabase.from("reminders").insert({
      user_id: user.id,
      title,
      due_at: new Date(date).toISOString(),
    });
    if (error) toast.error(error.message);
    else {
      setTitle("");
      setDate("");
      toast.success("Reminder added");
      load();
    }
  };

  const markDone = async (id: string) => {
    await supabase.from("reminders").update({ done_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("reminders").delete().eq("id", id);
    load();
  };

  const upcoming = items.filter((r) => !r.done_at);
  const done = items.filter((r) => r.done_at);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-8 md:py-12">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Reminders</h1>
        </div>
        <p className="mt-1 text-muted-foreground">Never miss a claim deadline or follow-up.</p>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto] md:items-end">
            <div>
              <Label className="text-xs">What</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Submit claim form to TPA" />
            </div>
            <div>
              <Label className="text-xs">When</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button onClick={add} className="bg-gradient-hero"><Plus className="mr-2 h-4 w-4" /> Add</Button>
          </div>
        </div>

        <Section title="Upcoming">
          {upcoming.length === 0 ? (
            <Empty>No upcoming reminders.</Empty>
          ) : (
            upcoming.map((r) => <Item key={r.id} r={r} onDone={() => markDone(r.id)} onDelete={() => remove(r.id)} />)
          )}
        </Section>

        {done.length > 0 && (
          <Section title="Done">
            {done.map((r) => <Item key={r.id} r={r} onDone={() => {}} onDelete={() => remove(r.id)} done />)}
          </Section>
        )}
      </main>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="font-display text-lg font-semibold">{title}</h2>
    <div className="mt-3 space-y-2">{children}</div>
  </section>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">{children}</div>
);

const Item = ({ r, onDone, onDelete, done }: { r: Reminder; onDone: () => void; onDelete: () => void; done?: boolean }) => {
  const due = new Date(r.due_at);
  const overdue = !done && due.getTime() < Date.now();
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${
      done ? "border-border/40 bg-muted/30 opacity-70" : overdue ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-card"
    }`}>
      <div className="min-w-0">
        <div className={`font-medium ${done ? "line-through" : ""}`}>{r.title}</div>
        <div className="text-xs text-muted-foreground">
          {due.toLocaleString()} {overdue && <span className="ml-1 font-medium text-destructive">· Overdue</span>}
          {r.claim_id && <> · <Link to={`/claims/${r.claim_id}`} className="text-primary hover:underline">View claim</Link></>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!done && (
          <Button variant="ghost" size="icon" onClick={onDone} title="Mark done"><Check className="h-4 w-4" /></Button>
        )}
        <Button variant="ghost" size="icon" onClick={onDelete} title="Delete"><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default Reminders;