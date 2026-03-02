import { getSession } from "@/lib/auth";
import { getHealthGoals } from "@/features/health/queries";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function ObiettiviPage() {
  const session = (await getSession())!;
  const goals = await getHealthGoals(session.user.id);

  return (
    <div>
      <PageHeader
        title="Obiettivi salute"
        description="I tuoi obiettivi di salute e benessere."
        actions={
          <Button asChild>
            <Link href="/salute/obiettivi/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo obiettivo
            </Link>
          </Button>
        }
      />

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nessun obiettivo creato.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/salute/obiettivi/new">Crea il tuo primo obiettivo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateGoalProgress(goal.currentValue, goal.targetValue);
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Link href={`/salute/obiettivi/${goal.id}`}>
                      <CardTitle className="text-lg hover:underline">{goal.title}</CardTitle>
                    </Link>
                    <div className="flex items-center gap-2">
                      {goal.category && <Badge variant="outline">{goal.category}</Badge>}
                      <Badge variant={statusVariants[goal.status] ?? "secondary"}>
                        {statusLabels[goal.status] ?? goal.status}
                      </Badge>
                    </div>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {progress !== null && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          {goal.currentValue} / {goal.targetValue} {goal.targetUnit}
                        </span>
                        <span>{progress}%</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {goal.startDate && <span>Inizio: {goal.startDate}</span>}
                    {goal.targetDate && <span>Scadenza: {goal.targetDate}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
