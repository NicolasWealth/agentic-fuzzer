import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: "orange" | "green" | "blue";
}

const accentMap = {
  orange: "border-neon-orange/30 text-neon-orange",
  green: "border-neon-green/30 text-neon-green",
  blue: "border-primary/30 text-primary",
};

const glowMap = {
  orange: "glow-orange",
  green: "glow-green",
  blue: "",
};

const StatCard = ({ title, value, icon, accentColor }: StatCardProps) => (
  <Card className={cn("border bg-card/80 backdrop-blur-sm", accentMap[accentColor], glowMap[accentColor])}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
          <p className={cn("text-3xl font-bold font-mono", accentMap[accentColor].split(" ").pop())}>{value}</p>
        </div>
        <div className={cn("p-3 rounded-lg bg-secondary/50", accentMap[accentColor].split(" ").pop())}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StatCard;
