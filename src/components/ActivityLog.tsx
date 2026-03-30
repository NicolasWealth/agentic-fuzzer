import { useEffect, useRef } from "react";

interface ActivityLogProps {
  logs: string[];
}

const ActivityLog = ({ logs }: ActivityLogProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="rounded-lg border border-neon-green/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse-glow" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Activity Log</span>
      </div>
      <div
        ref={scrollRef}
        className="bg-terminal-bg p-4 h-64 overflow-y-auto font-mono text-sm"
      >
        {logs.length === 0 ? (
          <p className="text-muted-foreground">
            <span className="text-terminal">$</span> Awaiting command...
          </p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-terminal leading-relaxed">
              <span className="text-muted-foreground select-none">[{String(i).padStart(3, "0")}]</span>{" "}
              {log}
            </div>
          ))
        )}
        <span className="text-terminal animate-pulse-glow">█</span>
      </div>
    </div>
  );
};

export default ActivityLog;
