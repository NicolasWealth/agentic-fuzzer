import { cn } from "@/lib/utils";

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

interface AttackResultsProps {
  results: EndpointAnalysis[];
}

const attackBadgeColor: Record<string, string> = {
  "sql injection": "bg-destructive/20 text-destructive",
  "nosql injection": "bg-neon-orange/20 text-neon-orange",
  "broken authentication": "bg-purple-500/20 text-purple-400",
  xss: "bg-neon-green/20 text-neon-green",
  "path traversal": "bg-blue-500/20 text-blue-400",
  rce: "bg-red-600/20 text-red-400",
  idor: "bg-yellow-500/20 text-yellow-400",
};

const sevColor: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-neon-orange/20 text-neon-orange",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-muted text-muted-foreground",
};

function getBadgeClass(type: string) {
  const t = type.toLowerCase();
  for (const [key, cls] of Object.entries(attackBadgeColor)) {
    if (t.includes(key)) return cls;
  }
  return "bg-muted text-muted-foreground";
}

const methodColor: Record<string, string> = {
  POST: "text-neon-green",
  GET: "text-blue-400",
  PUT: "text-neon-orange",
  DELETE: "text-destructive",
  PATCH: "text-purple-400",
};

const AttackResults = ({ results }: AttackResultsProps) => {
  if (!results.length) return null;

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
        Attack Payloads Generated
      </h2>
      {results.map((item, i) => {
        const parts = item.endpoint.split(" ");
        const method = parts[0]?.toUpperCase() || "GET";
        const path = parts.slice(1).join(" ") || "/";

        return (
          <div key={i} className="rounded-lg border border-border overflow-hidden bg-card/50">
            <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50 border-b border-border">
              <span className={cn("font-mono text-xs font-bold", methodColor[method] || "text-foreground")}>
                {method}
              </span>
              <span className="font-mono text-sm text-foreground">{path}</span>
            </div>
            {item.payloads.map((p, j) => {
              const payloadStr =
                typeof p.payload === "object" ? JSON.stringify(p.payload, null, 2) : String(p.payload);
              return (
                <div key={j} className="px-4 py-3 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded font-medium", getBadgeClass(p.attack_type))}>
                      {p.attack_type}
                    </span>
                    <span className={cn("text-[11px] px-2 py-0.5 rounded", sevColor[p.severity] || sevColor.low)}>
                      {p.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1 font-mono">payload</p>
                  <pre className="text-xs font-mono bg-secondary/50 p-3 rounded border border-border overflow-x-auto text-foreground">
                    {payloadStr}
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">{p.expected_vulnerability}</p>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default AttackResults;
