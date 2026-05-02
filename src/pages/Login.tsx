import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { Shield } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container flex max-w-md flex-col items-stretch py-12">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">Forgot password?</Link>
          <Link to="/signup" className="font-medium text-primary">Create account</Link>
        </div>
      </main>
    </div>
  );
};

export default Login;