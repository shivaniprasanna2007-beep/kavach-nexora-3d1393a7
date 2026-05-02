import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

type LineItem = {
  description: string;
  billed_amount: number;
  fair_amount: number;
  overcharge: number;
  status: "overcharged" | "fair" | "duplicate" | "unverified";
  reason?: string;
};

type Scheme = { name: string; applicable: boolean; reason?: string };

type AuditPayload = {
  summary: string;
  total_billed: number;
  fair_value: number;
  total_overcharge: number;
  line_items: LineItem[];
  schemes: Scheme[];
  recommendations: string[];
  hospital_name?: string | null;
  patient_name?: string | null;
  bill_date?: string | null;
  bill_number?: string | null;
};

const SYSTEM_PROMPT = `You are a hospital bill auditor for India. Analyze this bill and return ONLY a JSON object with this exact structure, no other text:

{"summary": "2-3 sentence plain language summary", "total_billed": number, "fair_value": number, "total_overcharge": number, "line_items": [{"description": "item name", "billed_amount": number, "fair_amount": number, "overcharge": number, "status": "overcharged|fair|duplicate|unverified", "reason": "why flagged or why fair"}], "schemes": [{"name": "scheme name", "applicable": true/false, "reason": "why applicable"}], "recommendations": ["action 1", "action 2"]}

For fair_amount, use CGHS 2023 rates if the procedure is listed. If unlisted, use typical private hospital rates for India and mark status as unverified. Calculate overcharge as billed_amount minus fair_amount (minimum 0). Be specific — do not say 'all items are fair priced' without checking each line item individually against CGHS rates.`;

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
                text: `Audit this hospital bill. Output language for summary, reasons, scheme reasons, and recommendations: ${langName}. Keep JSON keys and the "status" enum value in English. Also extract hospital_name, patient_name, bill_date (YYYY-MM-DD) and bill_number into the JSON if visible.`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
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
    const rawContent: string = aiData?.choices?.[0]?.message?.content ?? "";
    if (!rawContent) {
      await admin
        .from("bills")
        .update({ status: "failed", error_message: "Empty AI response" })
        .eq("id", bill_id);
      return json({ error: "AI returned no content" }, 500);
    }

    let parsed: AuditPayload;
    try {
      parsed = JSON.parse(stripCodeFences(rawContent));
    } catch (_e) {
      await admin.from("bills").update({ status: "failed", error_message: "Invalid AI JSON" }).eq("id", bill_id);
      return json({ error: "Invalid AI response" }, 500);
    }

    const lineItems = Array.isArray(parsed.line_items) ? parsed.line_items : [];
    const totalBilled =
      Number(parsed.total_billed) ||
      lineItems.reduce((s, it) => s + (Number(it.billed_amount) || 0), 0);
    const fairValue =
      Number(parsed.fair_value) ||
      lineItems.reduce((s, it) => s + (Number(it.fair_amount) || 0), 0);
    const totalOver =
      Number(parsed.total_overcharge) ?? Math.max(0, totalBilled - fairValue);
    const potentialSavings = Math.max(0, totalOver);

    // Persist results
    await admin.from("bill_items").delete().eq("bill_id", bill_id);
    await admin.from("audit_findings").delete().eq("bill_id", bill_id);

    if (lineItems.length) {
      await admin.from("bill_items").insert(
        lineItems.map((it) => {
          const status = (it.status as string) || "unverified";
          return {
            bill_id,
            user_id: user.id,
            description: (it.description || "Item").slice(0, 500),
            category: status, // store status here for filtering
            quantity: 1,
            unit_price: null,
            amount: Number(it.billed_amount) || 0,
            fair_price: Number(it.fair_amount) || 0,
            overcharge: Math.max(0, Number(it.overcharge) || 0),
            is_overcharged: status === "overcharged" || status === "duplicate",
            notes: it.reason ?? null,
          };
        }),
      );
    }

    // Persist schemes + recommendations as audit_findings for cross-feature use.
    const findingsRows: Array<Record<string, unknown>> = [];
    for (const s of parsed.schemes ?? []) {
      if (!s?.name) continue;
      findingsRows.push({
        bill_id,
        user_id: user.id,
        kind: "scheme_eligibility",
        severity: s.applicable ? "medium" : "info",
        title: `${s.name}${s.applicable ? " — likely eligible" : " — not applicable"}`.slice(0, 200),
        description: s.reason ?? null,
        estimated_savings: null,
        recommended_action: s.applicable ? `Check eligibility for ${s.name}` : null,
      });
    }
    for (const r of parsed.recommendations ?? []) {
      if (!r) continue;
      findingsRows.push({
        bill_id,
        user_id: user.id,
        kind: "other",
        severity: "low",
        title: String(r).slice(0, 200),
        description: null,
        estimated_savings: null,
        recommended_action: String(r),
      });
    }
    if (findingsRows.length) {
      await admin.from("audit_findings").insert(findingsRows);
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
        total_fair: round2(fairValue),
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

function stripCodeFences(s: string) {
  const trimmed = s.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }
  return trimmed;
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