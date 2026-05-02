import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM_PROMPT = `You are KAVACH, an expert hospital bill auditor and patient advocate in India.
You write firm, polite, professional dispute letters that patients can send directly to a hospital billing department to contest specific overcharges.

Rules:
- Cite each disputed line item with its description and the overcharge amount.
- Reference fair market / CGHS-rate benchmarks where available.
- Be respectful but unambiguous: request a corrected bill, refund of the overcharge, and a written response within 14 days.
- Use the requested output language for the letter body, but keep monetary values in INR (₹).
- Do not invent legal threats. Mention that the patient may escalate to the State Health Authority / Consumer Forum if unresolved — that is acceptable.
- Keep the letter under ~450 words. Plain text only, no markdown.`;

const LANGUAGES: Record<string, string> = {
  en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", bn: "Bengali",
  mr: "Marathi", gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Missing authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u, error: ue } = await userClient.auth.getUser();
    if (ue || !u.user) return json({ error: "Unauthorized" }, 401);
    const user = u.user;

    const body = await req.json();
    const billId = body?.bill_id as string | undefined;
    const claimId = (body?.claim_id as string | undefined) ?? null;
    if (!billId) return json({ error: "bill_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: bill }, { data: items }, { data: findings }, { data: profile }] = await Promise.all([
      admin.from("bills").select("*").eq("id", billId).eq("user_id", user.id).maybeSingle(),
      admin.from("bill_items").select("description, amount, fair_price, overcharge, is_overcharged, notes").eq("bill_id", billId).eq("is_overcharged", true),
      admin.from("audit_findings").select("title, description, kind, severity, estimated_savings, recommended_action").eq("bill_id", billId),
      admin.from("profiles").select("full_name, phone, preferred_language").eq("id", user.id).maybeSingle(),
    ]);

    if (!bill) return json({ error: "Bill not found" }, 404);

    const lang = (body?.language as string) || profile?.preferred_language || bill.language || "en";
    const langName = LANGUAGES[lang] || "English";

    const userPrompt = `Write a dispute letter to the billing department of ${bill.hospital_name || "the hospital"}.

Patient: ${profile?.full_name || bill.patient_name || "[Patient name]"}
Contact: ${profile?.phone || "[Phone]"} / ${user.email || "[Email]"}
Bill no: ${bill.bill_number || "[Bill number]"}, Bill date: ${bill.bill_date || "[Bill date]"}
Total billed: ₹${bill.total_billed ?? "?"}
Total estimated overcharge: ₹${bill.total_overcharge ?? "?"}
Potential savings: ₹${bill.potential_savings ?? "?"}

Disputed line items (all flagged as overcharged):
${(items ?? []).slice(0, 25).map((it, i) => `${i + 1}. ${it.description} — billed ₹${it.amount ?? "?"}, fair ₹${it.fair_price ?? "?"}, overcharge ₹${it.overcharge ?? "?"}${it.notes ? `. Note: ${it.notes}` : ""}`).join("\n") || "(none flagged)"}

Audit findings:
${(findings ?? []).slice(0, 15).map((f, i) => `${i + 1}. [${f.severity}] ${f.title}${f.description ? ` — ${f.description}` : ""}${f.estimated_savings ? ` (₹${f.estimated_savings} savings)` : ""}`).join("\n") || "(none)"}

Output the full dispute letter in ${langName}. Plain text only, ready to print or email.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      console.error("AI gateway error:", status, await aiResp.text());
      if (status === 429) return json({ error: "Rate limit reached. Try again shortly." }, 429);
      if (status === 402) return json({ error: "AI credits exhausted. Add credits in Settings." }, 402);
      return json({ error: "AI gateway error" }, 500);
    }

    const aiData = await aiResp.json();
    const letter: string = aiData?.choices?.[0]?.message?.content || "";
    if (!letter.trim()) return json({ error: "AI returned an empty letter" }, 500);

    const title = `Dispute letter — ${bill.hospital_name || "Hospital"} (${new Date().toLocaleDateString("en-IN")})`;

    const { data: doc, error: insErr } = await admin
      .from("claim_documents")
      .insert({
        user_id: user.id,
        claim_id: claimId,
        bill_id: billId,
        kind: "dispute_letter",
        title,
        content: letter,
        language: lang,
      })
      .select("id")
      .single();

    if (insErr) {
      console.error(insErr);
      return json({ error: "Could not save letter" }, 500);
    }

    return json({ ok: true, document_id: doc.id, content: letter });
  } catch (e) {
    console.error("generate-dispute-letter error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}