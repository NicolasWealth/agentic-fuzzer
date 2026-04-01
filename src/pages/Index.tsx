import { useState, useCallback } from "react";
import { Shield, Bug, Radar, Crosshair, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";
import ActivityLog from "@/components/ActivityLog";
import AttackResults from "@/components/AttackResults";
import { supabase } from "@/integrations/supabase/client";

interface AttackPayload {
  attack_type: string;
  severity: "critical" | "high" | "medium" | "low";
  payload: Record<string, unknown> | string;
  expected_vulnerability: string;
}

interface ExploitRecord {
  endpoint: string;
  attack_type: string;
  severity: string;
  payload: string;
  reasoning: string;
  status: number;
}

interface EndpointAnalysis {
  endpoint: string;
  payloads: AttackPayload[];
}

const Index = () => {
  const [url, setUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [vulns, setVulns] = useState(0);
  const [endpoints, setEndpoints] = useState(0);
  const [score, setScore] = useState(100);
  const [results, setResults] = useState<EndpointAnalysis[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const runAttackSimulation = useCallback(async (targetUrl: string, attacks: EndpointAnalysis[]) => {
    const baseUrl = targetUrl.replace(/\/+$/, "");
    let scannedCount = 0;
    let exploitCount = 0;

    for (const ep of attacks) {
      const parts = ep.endpoint.split(" ");
      const method = (parts[0] || "GET").toUpperCase();
      const path = parts.slice(1).join(" ") || "/";
      const fullUrl = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

      for (const p of ep.payloads) {
        scannedCount++;
        setEndpoints(scannedCount);

        try {
          const isBodyMethod = ["POST", "PUT", "PATCH"].includes(method);
          const payloadBody = typeof p.payload === "object" ? JSON.stringify(p.payload) : String(p.payload);

          let fetchUrl = fullUrl;
          const fetchOptions: RequestInit = { method, headers: { "Content-Type": "application/json" } };

          if (isBodyMethod) {
            fetchOptions.body = payloadBody;
          } else {
            const sep = fetchUrl.includes("?") ? "&" : "?";
            if (typeof p.payload === "object") {
              const params = new URLSearchParams();
              for (const [k, v] of Object.entries(p.payload as Record<string, unknown>)) {
                params.set(k, String(v));
              }
              fetchUrl = `${fetchUrl}${sep}${params.toString()}`;
            } else {
              fetchUrl = `${fetchUrl}${sep}input=${encodeURIComponent(payloadBody)}`;
            }
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(fetchUrl, { ...fetchOptions, signal: controller.signal });
          clearTimeout(timeout);

          if (response.status === 500 || response.status === 403) {
            exploitCount++;
            setVulns(exploitCount);
            addLog(`🔴 [SUCCESSFUL EXPLOIT] ${p.attack_type} → ${ep.endpoint} (HTTP ${response.status})`);
          } else if (response.status === 200) {
            addLog(`🟢 [VULNERABILITY NOT FOUND] ${p.attack_type} → ${ep.endpoint} (HTTP 200)`);
          } else {
            addLog(`⚪ [HTTP ${response.status}] ${p.attack_type} → ${ep.endpoint}`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Request failed";
          addLog(`⊘ [TIMEOUT/ERROR] ${p.attack_type} → ${ep.endpoint} — ${msg}`);
        }
      }
    }

    setScore(Math.max(0, 100 - exploitCount * 15));
    if (exploitCount > 0) {
      addLog(`\n⚠ ${exploitCount} successful exploits confirmed!`);
    } else {
      addLog("✓ No exploitable vulnerabilities detected. Target appears resilient.");
    }
  }, []);

  const runSimulation = useCallback(async () => {
    if (!url.trim() || isRunning) return;
    setIsRunning(true);
    setLogs([]);
    setVulns(0);
    setEndpoints(0);
    setScore(100);
    setResults([]);

    addLog("Initializing attack surface reconnaissance...");
    addLog(`Target: ${url}`);
    addLog("Connecting to AI red team engine...");

    try {
      const { data, error } = await supabase.functions.invoke("red-team-analyze", {
        body: { apiUrl: url },
      });

      if (error) {
        throw new Error(error.message || "Edge function call failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const analysisResults: EndpointAnalysis[] = data.results || [];
      addLog(`AI analysis complete. ${analysisResults.length} endpoints analyzed.`);

      let vulnCount = 0;
      let epCount = analysisResults.length;

      analysisResults.forEach((ep) => {
        const method = ep.endpoint.split(" ")[0] || "GET";
        const path = ep.endpoint.split(" ").slice(1).join(" ") || "/";
        addLog(`[SCANNING...] ${method} ${path}`);

        ep.payloads.forEach((p) => {
          vulnCount++;
          const payloadStr = typeof p.payload === "object" ? JSON.stringify(p.payload) : String(p.payload);
          addLog(`[SCANNING...] [${p.severity.toUpperCase()}] ${p.attack_type} → ${payloadStr}`);
          addLog(`             └─ ${p.expected_vulnerability}`);
        });
      });

      setVulns(vulnCount);
      setEndpoints(epCount);
      setScore(Math.max(0, 100 - vulnCount * 5));
      setResults(analysisResults);

      addLog("Scan complete. Threat report generated.");
      addLog("");
      addLog("═══ PHASE 2: Executing payloads against target ═══");
      await runAttackSimulation(url, analysisResults);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      addLog(`✗ Error: ${msg}`);
      toast.error(msg);
    } finally {
      setIsRunning(false);
    }
  }, [url, isRunning]);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-primary/10 glow-orange">
          <Crosshair className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground">
            Agentic Fuzzer
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Red Team Attack Simulation Platform
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Vulnerabilities Found"
          value={vulns}
          icon={<Bug className="w-6 h-6" />}
          accentColor="orange"
        />
        <StatCard
          title="Endpoints Scanned"
          value={endpoints}
          icon={<Radar className="w-6 h-6" />}
          accentColor="green"
        />
        <StatCard
          title="Security Score"
          value={`${score}%`}
          icon={<Shield className="w-6 h-6" />}
          accentColor={score > 70 ? "green" : "orange"}
        />
      </div>

      {/* Input & Action */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://target-api.example.com/api/v1"
          className="flex-1 h-12 font-mono text-sm bg-secondary border-border focus-visible:ring-primary"
        />
        <Button
          variant="attack"
          size="lg"
          className="h-12 px-8"
          onClick={runSimulation}
          disabled={isRunning || !url.trim()}
        >
          {isRunning ? "Analyzing..." : "Initialize Attack Simulation"}
        </Button>
      </div>

      {/* Activity Log */}
      <ActivityLog logs={logs} />

      {/* Attack Results */}
      <AttackResults results={results} />
    </div>
  );
};

export default Index;
