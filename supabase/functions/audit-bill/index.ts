import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

type AuditPayload = {
  hospital_name?: string | null;
  patient_name?: string | null;
  bill_date?: string | null;
  bill_number?: string | null;
  total_billed?: number | null;
  total_fair?: number | null;
  total_overcharge?: number | null;
  potential_savings?: number | null;
  summary?: string;
  items?: Array<{
    description: string;
    category?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
    amount?: number | null;
    fair_price?: number | null;
    overcharge?: number | null;
    is_overcharged?: boolean;
    notes?: string | null;
  }>;
  findings?: Array<{
    kind: "overcharge" | "scheme_eligibility" | "duplicate" | "unnecessary" | "insurance" | "other";
    severity: "info" | "low" | "medium" | "high";
    title: string;
    description?: string;
    estimated_savings?: number | null;
    recommended_action?: string;
  }>;
};

const SYSTEM_PROMPT = `You are KAVACH, an expert hospital-bill auditor for Indian patients.
You receive a single image (or PDF page) of a hospital bill. In ONE pass you must:
  1. OCR the bill (it may be in English, Hindi, Tamil, Telugu, Marathi, etc.).
  2. Extract structured line items (description, qty, unit price, amount).
  3. Audit each item: estimate a fair market / CGHS-rate price, flag overcharges, duplicates, unnecessary items.
  4. Identify likely scheme eligibility (Ayushman Bharat / PMJAY, ESI, CGHS, state schemes) and insurance claim hints.
  5. Produce a concise patient-friendly summary in the requested output language.

If the image is unreadable or not a hospital bill, return empty items and a finding explaining why.
Always be conservative with fair prices — if unsure, leave fair_price null and is_overcharged false.
All monetary values are in INR unless the bill clearly states otherwise.`;

const TOOL = {
  type: "function",
  function: {
    name: "submit_audit",
    description: "Submit the structured audit of the hospital bill.",
    parameters: {
      type: "object",
      properties: {
        hospital_name: { type: ["string", "null"] },
        patient_name: { type: ["string", "null"] },
        bill_date: { type: ["string", "null"], description: "ISO date YYYY-MM-DD" },
        bill_number: { type: ["string", "null"] },
        total_billed: { type: ["number", "null"] },
        total_fair: { type: ["number", "null"] },
        total_overcharge: { type: ["number", "null"] },
        potential_savings: { type: ["number", "null"] },
        summary: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              category: { type: ["string", "null"] },
              quantity: { type: ["number", "null"] },
              unit_price: { type: ["number", "null"] },
              amount: { type: ["number", "null"] },
              fair_price: { type: ["number", "null"] },
              overcharge: { type: ["number", "null"] },
              is_overcharged: { type: "boolean" },
              notes: { type: ["string", "null"] },
            },
            required: ["description", "is_overcharged"],
          },
        },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              kind: {
                type: "string",
                enum: ["overcharge", "scheme_eligibility", "duplicate", "unnecessary", "insurance", "other"],
              },
              severity: { type: "string", enum: ["info", "low", "medium", "high"] },
              title: { type: "string" },
              description: { type: "string" },
              estimated_savings: { type: ["number", "null"] },
              recommended_action: { type: "string" },
            },
            required: ["kind", "severity", "title"],
          },
        },
      },
      required: ["summary", "items", "findings"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const user = userData.user;

    const { bill_id } = await req.json();
    if (!bill_id || typeof bill_id !== "string") {
      return json({ error: "bill_id required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: bill, error: billErr } = await admin
      .from("bills")
      .select("*")
      .eq("id", bill_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (billErr || !bill) {
      return json({ error: "Bill not found" }, 404);
    }

    await admin.from("bills").update({ status: "processing", error_message: null }).eq("id", bill_id);

    // Download file from storage and inline as base64 data URL
    const { data: fileBlob, error: dlErr } = await admin.storage.from("bills").download(bill.file_path);
    if (dlErr || !fileBlob) {
      await admin.from("bills").update({ status: "failed", error_message: "File download failed" }).eq("id", bill_id);
      return json({ error: "File download failed" }, 500);
    }
    const buf = new Uint8Array(await fileBlob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const base64 = btoa(binary);
    const mime = bill.file_mime || fileBlob.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64}`;

    const langName = languageName(bill.language || "en");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Audit this hospital bill. Output language for summary, finding titles/descriptions and recommended_action: ${langName}. Keep keys (description, category, kind, severity) in English.`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "submit_audit" } },
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      const text = await aiResp.text();
      console.error("AI gateway error:", status, text);
      await admin
        .from("bills")
        .update({ status: "failed", error_message: `AI error ${status}` })
        .eq("id", bill_id);
      if (status === 429) return json({ error: "Rate limit reached. Please try again shortly." }, 429);
      if (status === 402) return json({ error: "AI credits exhausted. Add credits in Settings." }, 402);
      return json({ error: "AI gateway error" }, 500);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      await admin
        .from("bills")
        .update({ status: "failed", error_message: "No structured response from AI" })
        .eq("id", bill_id);
      return json({ error: "AI did not return structured audit" }, 500);
    }

    let parsed: AuditPayload;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (_e) {
      await admin.from("bills").update({ status: "failed", error_message: "Invalid AI JSON" }).eq("id", bill_id);
      return json({ error: "Invalid AI response" }, 500);
    }

    // Compute totals defensively
    const items = parsed.items ?? [];
    const totalBilled =
      parsed.total_billed ?? items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const totalFair =
      parsed.total_fair ?? items.reduce((s, it) => s + (Number(it.fair_price ?? it.amount) || 0), 0);
    const totalOver = parsed.total_overcharge ?? Math.max(0, totalBilled - totalFair);
    const findings = parsed.findings ?? [];
    const findingSavings = findings.reduce((s, f) => s + (Number(f.estimated_savings) || 0), 0);
    const potentialSavings = parsed.potential_savings ?? Math.max(totalOver, findingSavings);

    // Persist results
    await admin.from("bill_items").delete().eq("bill_id", bill_id);
    await admin.from("audit_findings").delete().eq("bill_id", bill_id);

    if (items.length) {
      await admin.from("bill_items").insert(
        items.map((it) => ({
          bill_id,
          user_id: user.id,
          description: it.description?.slice(0, 500) || "Item",
          category: it.category ?? null,
          quantity: it.quantity ?? 1,
          unit_price: it.unit_price ?? null,
          amount: it.amount ?? null,
          fair_price: it.fair_price ?? null,
          overcharge: it.overcharge ?? null,
          is_overcharged: !!it.is_overcharged,
          notes: it.notes ?? null,
        })),
      );
    }

    if (findings.length) {
      await admin.from("audit_findings").insert(
        findings.map((f) => ({
          bill_id,
          user_id: user.id,
          kind: f.kind,
          severity: f.severity,
          title: f.title.slice(0, 200),
          description: f.description ?? null,
          estimated_savings: f.estimated_savings ?? null,
          recommended_action: f.recommended_action ?? null,
        })),
      );
    }

    await admin
      .from("bills")
      .update({
        status: "audited",
        hospital_name: parsed.hospital_name ?? null,
        patient_name: parsed.patient_name ?? null,
        bill_date: parsed.bill_date || null,
        bill_number: parsed.bill_number ?? null,
        total_billed: round2(totalBilled),
        total_fair: round2(totalFair),
        total_overcharge: round2(totalOver),
        potential_savings: round2(potentialSavings),
        audit_summary: parsed.summary ?? null,
        audit_raw: parsed as unknown as Record<string, unknown>,
      })
      .eq("id", bill_id);

    return json({ ok: true, bill_id });
  } catch (e) {
    console.error("audit-bill error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function round2(n: number | null | undefined) {
  if (n == null || isNaN(n as number)) return null;
  return Math.round((n as number) * 100) / 100;
}

function languageName(code: string) {
  const map: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    ta: "Tamil",
    te: "Telugu",
    bn: "Bengali",
    mr: "Marathi",
    gu: "Gujarati",
    kn: "Kannada",
    ml: "Malayalam",
    pa: "Punjabi",
  };
  return map[code] || "English";
}