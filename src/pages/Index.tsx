import { useState, useCallback } from "react";
import { Shield, Bug, Radar, Crosshair } from "lucide-react";
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
        addLog(`Scanning ${method} ${path}...`);

        ep.payloads.forEach((p) => {
          vulnCount++;
          const icon = p.severity === "critical" || p.severity === "high" ? "⚠" : "✓";
          addLog(`${icon} [${p.severity.toUpperCase()}] ${p.attack_type} on ${ep.endpoint}`);
        });
      });

      setVulns(vulnCount);
      setEndpoints(epCount);
      setScore(Math.max(0, 100 - vulnCount * 5));
      setResults(analysisResults);

      addLog("Scan complete. Threat report generated.");
      addLog("");
      addLog("═══ PHASE 2: Executing payloads against target ═══");

      try {
        const { data: execData, error: execError } = await supabase.functions.invoke("red-team-execute", {
          body: { apiUrl: url, attacks: analysisResults },
        });

        if (execError) {
          addLog(`✗ Execution error: ${execError.message}`);
        } else if (execData?.results) {
          const execResults = execData.results as Array<{
            endpoint: string;
            attack_type: string;
            severity: string;
            status: number | null;
            vulnerable: boolean;
            error: string | null;
            response_snippet: string;
          }>;

          let confirmedVulns = 0;
          execResults.forEach((r) => {
            if (r.error) {
              addLog(`⊘ [TIMEOUT] ${r.attack_type} → ${r.endpoint} — ${r.error}`);
            } else if (r.vulnerable) {
              confirmedVulns++;
              addLog(`⚠ POTENTIAL VULNERABILITY FOUND — ${r.attack_type} → ${r.endpoint} (HTTP ${r.status})`);
            } else {
              addLog(`✓ [${r.status}] ${r.attack_type} → ${r.endpoint} — No server error`);
            }
          });

          if (confirmedVulns > 0) {
            addLog(`\n⚠ ${confirmedVulns} potential vulnerabilities confirmed via 500 responses!`);
            setVulns(confirmedVulns);
            setScore(Math.max(0, 100 - confirmedVulns * 15));
          } else {
            addLog("✓ No 500 errors detected. Target appears resilient.");
          }
        }
      } catch (execErr) {
        const execMsg = execErr instanceof Error ? execErr.message : "Unknown error";
        addLog(`✗ Execution phase error: ${execMsg}`);
      }

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
