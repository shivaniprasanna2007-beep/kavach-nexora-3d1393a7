import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SEO title="Page not found · KAVACH" description="The page you're looking for doesn't exist." />
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight">404</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          We couldn't find that page. It may have moved or never existed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-gradient-hero">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
