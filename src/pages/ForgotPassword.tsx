import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Reset link sent — check your email.");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container flex max-w-md flex-col py-12">
        <h1 className="mb-2 font-display text-2xl font-bold">Reset your password</h1>
        <p className="mb-6 text-sm text-muted-foreground">We'll email you a link to set a new password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <Link to="/login" className="mt-4 text-sm text-muted-foreground hover:text-foreground">← Back to login</Link>
      </main>
    </div>
  );
};

export default ForgotPassword;