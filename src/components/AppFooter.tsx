import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const AppFooter = () => (
  <footer className="border-t border-border/60 bg-card/40">
    <div className="container grid gap-8 py-12 md:grid-cols-4">
      <div>
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">KAVACH</span>
        </Link>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">
          Hospital bills, decoded. AI-powered audits and claims for Indian patients.
        </p>
      </div>
      <FooterCol title="Product" links={[
        { to: "/dashboard", label: "Dashboard" },
        { to: "/upload", label: "Upload bill" },
        { to: "/claims", label: "Claims" },
        { to: "/schemes", label: "Schemes" },
      ]} />
      <FooterCol title="Company" links={[
        { to: "/about", label: "About" },
        { to: "/help", label: "Help center" },
        { to: "/privacy", label: "Privacy" },
        { to: "/terms", label: "Terms" },
      ]} />
      <FooterCol title="Account" links={[
        { to: "/login", label: "Login" },
        { to: "/signup", label: "Sign up" },
        { to: "/settings", label: "Settings" },
        { to: "/analytics", label: "Analytics" },
      ]} />
    </div>
    <div className="border-t border-border/60 py-5">
      <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground md:flex-row">
        <span>© {new Date().getFullYear()} KAVACH. All rights reserved.</span>
        <span>Made with care for Indian patients and families.</span>
      </div>
    </div>
  </footer>
);

const FooterCol = ({ title, links }: { title: string; links: { to: string; label: string }[] }) => (
  <div>
    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{title}</div>
    <ul className="space-y-2 text-sm">
      {links.map((l) => (
        <li key={l.to}>
          <Link to={l.to} className="text-muted-foreground hover:text-foreground">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default AppFooter;