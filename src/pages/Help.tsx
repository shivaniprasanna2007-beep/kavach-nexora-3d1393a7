import { useState } from "react";
import MarketingPage from "@/components/MarketingPage";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What kinds of bills can KAVACH audit?",
    a: "Hospital bills, pharmacy invoices, diagnostic lab reports and discharge summaries from any Indian hospital. We support PDF, JPG, PNG and HEIC. Scanned, photographed or digitally generated bills all work.",
  },
  {
    q: "How does the AI find overcharges?",
    a: "We extract every line item from your bill, then compare each one against fair-market reference rates (including CGHS rates for procedures and consumables). Items priced significantly above the reference, duplicates, and unbundled charges are flagged with an estimated overcharge.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Every bill is stored encrypted in a private bucket and is only visible to you. We never share or sell your data. You can delete a bill at any time from your history.",
  },
  {
    q: "Which government schemes do you check?",
    a: "PMJAY (Ayushman Bharat), CGHS, ESI and major state schemes. KAVACH tells you whether your situation likely qualifies and how to apply — but final eligibility is decided by the scheme.",
  },
  {
    q: "Can I dispute charges with the hospital?",
    a: "Yes. From any audited bill you can generate a dispute letter that lists every flagged item with line numbers, amounts and the reason for dispute. You can edit it before sending.",
  },
  {
    q: "How accurate is the audit?",
    a: "KAVACH gives you a strong first opinion in seconds. For complex multi-page surgery bills we recommend reviewing the flagged items with a financial counsellor before formally disputing.",
  },
  {
    q: "Do you support languages other than English?",
    a: "Yes — Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam and Punjabi for both bill OCR and report generation.",
  },
  {
    q: "How do I track a claim I've filed?",
    a: "Open the Claims page, create a new claim from your audited bill, and update its status as you submit, follow up and receive a decision. KAVACH will remind you about deadlines.",
  },
];

const Help = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <MarketingPage
      title="Help center"
      metaTitle="Help & FAQ · KAVACH"
      metaDescription="Common questions about KAVACH — uploading bills, AI auditing, government schemes, claims and privacy."
      intro="Quick answers to the questions patients ask us most."
    >
      <div className="not-prose mt-2 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left"
            >
              <span className="font-medium">{f.q}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="border-t border-border/60 p-4 text-sm leading-relaxed text-muted-foreground">{f.a}</div>
            )}
          </div>
        ))}
      </div>
      <h2>Still need help?</h2>
      <p>
        Email <a href="mailto:support@kavach.app">support@kavach.app</a> with your bill ID and a short description.
        We typically reply within one business day.
      </p>
    </MarketingPage>
  );
};

export default Help;