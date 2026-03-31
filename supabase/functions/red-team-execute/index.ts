import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AttackPayload {
  attack_type: string;
  severity: string;
  payload: Record<string, unknown> | string;
  expected_vulnerability: string;
}

interface EndpointAnalysis {
  endpoint: string;
  payloads: AttackPayload[];
}

interface ExecuteRequest {
  apiUrl: string;
  attacks: EndpointAnalysis[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiUrl, attacks }: ExecuteRequest = await req.json();

    if (!apiUrl || typeof apiUrl !== "string" || apiUrl.length > 2048) {
      return new Response(
        JSON.stringify({ error: "Invalid API URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(attacks) || attacks.length === 0) {
      return new Response(
        JSON.stringify({ error: "No attacks provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize base URL
    const baseUrl = apiUrl.replace(/\/+$/, "");

    interface PayloadResult {
      endpoint: string;
      attack_type: string;
      severity: string;
      status: number | null;
      vulnerable: boolean;
      error: string | null;
      response_snippet: string;
    }

    const results: PayloadResult[] = [];

    for (const ep of attacks) {
      const parts = ep.endpoint.split(" ");
      const method = (parts[0] || "GET").toUpperCase();
      const path = parts.slice(1).join(" ") || "/";

      // Build full URL
      const fullUrl = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

      for (const p of ep.payloads) {
        try {
          const isBodyMethod = ["POST", "PUT", "PATCH"].includes(method);
          const payloadBody = typeof p.payload === "object" ? JSON.stringify(p.payload) : String(p.payload);

          let targetUrl = fullUrl;
          const fetchOptions: RequestInit = {
            method,
            headers: { "Content-Type": "application/json" },
          };

          if (isBodyMethod) {
            fetchOptions.body = payloadBody;
          } else {
            // Append payload as query params for GET/DELETE
            const separator = targetUrl.includes("?") ? "&" : "?";
            if (typeof p.payload === "object") {
              const params = new URLSearchParams();
              for (const [k, v] of Object.entries(p.payload as Record<string, unknown>)) {
                params.set(k, String(v));
              }
              targetUrl = `${targetUrl}${separator}${params.toString()}`;
            } else {
              targetUrl = `${targetUrl}${separator}input=${encodeURIComponent(String(p.payload))}`;
            }
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(targetUrl, {
            ...fetchOptions,
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const responseText = await response.text();
          const snippet = responseText.substring(0, 200);

          results.push({
            endpoint: ep.endpoint,
            attack_type: p.attack_type,
            severity: p.severity,
            status: response.status,
            vulnerable: response.status >= 500,
            error: null,
            response_snippet: snippet,
          });
        } catch (fetchErr) {
          results.push({
            endpoint: ep.endpoint,
            attack_type: p.attack_type,
            severity: p.severity,
            status: null,
            vulnerable: false,
            error: fetchErr instanceof Error ? fetchErr.message : "Request failed",
            response_snippet: "",
          });
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("red-team-execute error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
