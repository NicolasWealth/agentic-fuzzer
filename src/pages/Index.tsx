import { useState, useCallback } from "react";
import { Shield, Bug, Radar, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import ActivityLog from "@/components/ActivityLog";

const SIMULATED_LOGS = [
  "Initializing attack surface reconnaissance...",
  "Resolving target DNS records...",
  "Enumerating API endpoints via OpenAPI spec...",
  "Testing /api/v1/users — 200 OK",
  "Testing /api/v1/auth/login — 200 OK",
  "⚠ IDOR vulnerability detected on /api/v1/users/{id}",
  "Testing /api/v1/admin — 403 Forbidden",
  "Attempting privilege escalation via JWT manipulation...",
  "⚠ Broken access control on /api/v1/admin/config",
  "Testing rate limiting on /api/v1/auth/login...",
  "⚠ No rate limiting detected — brute force possible",
  "Scanning for SQL injection vectors...",
  "Testing /api/v1/search?q=' OR 1=1 --",
  "✓ SQL injection mitigated on /api/v1/search",
  "Testing CORS configuration...",
  "⚠ Wildcard CORS origin detected",
  "Fuzzing request headers with malformed payloads...",
  "Testing for SSRF via /api/v1/webhook endpoint...",
  "✓ SSRF protections in place",
  "Scan complete. Generating threat report...",
];

const Index = () => {
  const [url, setUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [vulns, setVulns] = useState(0);
  const [endpoints, setEndpoints] = useState(0);
  const [score, setScore] = useState(100);

  const runSimulation = useCallback(() => {
    if (!url.trim() || isRunning) return;
    setIsRunning(true);
    setLogs([]);
    setVulns(0);
    setEndpoints(0);
    setScore(100);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= SIMULATED_LOGS.length) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }
      const log = SIMULATED_LOGS[idx];
      setLogs((prev) => [...prev, log]);
      if (log.startsWith("⚠")) setVulns((v) => v + 1);
      if (log.includes("Testing /")) setEndpoints((e) => e + 1);
      if (log.startsWith("⚠")) setScore((s) => Math.max(0, s - 12));
      idx++;
    }, 400);
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
          {isRunning ? "Scanning..." : "Initialize Attack Simulation"}
        </Button>
      </div>

      {/* Activity Log */}
      <ActivityLog logs={logs} />
    </div>
  );
};

export default Index;
