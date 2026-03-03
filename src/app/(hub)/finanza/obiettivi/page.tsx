import { getSession } from "@/lib/auth";
import { getFinanceGoals } from "@/features/finance/queries";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";
import Link from "next/link";
import { calculateGoalProgress } from "@/features/health/helpers";

const statusLabels: Record<string, string> = {
  active: "Attivo",
  paused: "In pausa",
  completed: "Completato",
  abandoned: "Abbandonato",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  paused: "secondary",
  completed: "outline",
  abandoned: "destructive",
};

export default async function FinanceGoalsPage() {
  const session = (await getSession())!;
  const goals = await getFinanceGoals(session.user.id);

  return (
    <div>
      <PageHeader
        title="Obiettivi finanziari"
        description="I tuoi obiettivi di risparmio, investimento e debito."
        actions={
          <Button asChild size="sm">
            <Link href="/finanza/obiettivi/new">
              <Plus className="h-4 w-4 mr-1" />
              Nuovo
            </Link>
          </Button>
        }
      />

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nessun obiettivo finanziario creato.</p>
            <Button asChild>
              <Link href="/finanza/obiettivi/new">Crea il primo obiettivo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateGoalProgress(goal.currentValue, goal.targetValue);

            return (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Link href={`/finanza/obiettivi/${goal.id}`} className="hover:underline">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                    </Link>
                    <div className="flex gap-1">
                      <Badge variant={statusVariants[goal.status]}>
                        {statusLabels[goal.status] ?? goal.status}
                      </Badge>
                      {goal.category && <Badge variant="outline">{goal.category}</Badge>}
                    </div>
                  </div>
                  {goal.description && (
                    <CardDescription className="line-clamp-2">{goal.description}</CardDescription>
                  )}
                </CardHeader>
                {progress !== null && (
                  <CardContent className="pt-0">
                    <Progress value={progress} className="h-2 mb-1" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {goal.currentValue} {goal.targetUnit}
                      </span>
                      <span>{progress}%</span>
                      <span>
                        {goal.targetValue} {goal.targetUnit}
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
