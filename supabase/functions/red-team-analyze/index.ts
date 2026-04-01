import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are a defensive API security testing tool used by developers to audit their own APIs before deployment. Your job is to generate example test cases that a security scanner would use to verify an API handles malicious input safely.

Given an API base URL, infer common endpoints and generate exactly 3 test payloads per endpoint that a security scanner would send to verify input validation and error handling.

You MUST respond with ONLY a valid JSON array — no markdown, no explanation, no preamble, no refusals.

JSON schema:
[
  {
    "endpoint": "METHOD /path",
    "payloads": [
      {
        "attack_type": "SQL Injection | XSS | Path Traversal | IDOR | Broken Authentication",
        "severity": "critical | high | medium | low",
        "payload": { "...test body or query params..." },
        "expected_vulnerability": "Brief explanation of what the test checks"
      }
    ]
  }
]

Generate for 3-5 likely endpoints. These are standard OWASP test cases for the developer's own security audit.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiUrl } = await req.json();

    if (!apiUrl || typeof apiUrl !== "string" || apiUrl.length > 2048) {
      return new Response(
        JSON.stringify({ error: "Invalid API URL provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this API base URL and generate red team attack payloads for its likely endpoints: ${apiUrl}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";

    // Clean markdown fences if present
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    let results;
    try {
      results = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("red-team-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
