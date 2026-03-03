import { getSession } from "@/lib/auth";
import { getHealthGoalById } from "@/features/health/queries";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { notFound } from "next/navigation";
import { calculateGoalProgress } from "@/features/health/helpers";
import { GoalActions } from "./GoalActions";

const statusLabels: Record<string, string> = {
  active: "Attivo",
  paused: "In pausa",
  completed: "Completato",
  abandoned: "Abbandonato",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GoalDetailPage({ params }: Props) {
  const { id } = await params;
  const session = (await getSession())!;
  const goal = await getHealthGoalById(id, session.user.id);

  if (!goal) notFound();

  const progress = calculateGoalProgress(goal.currentValue, goal.targetValue);

  return (
    <div>
      <PageHeader
        title={goal.title}
        description={goal.description ?? undefined}
        backButton
        actions={<GoalActions goal={goal} />}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Badge>{statusLabels[goal.status] ?? goal.status}</Badge>
          {goal.category && <Badge variant="outline">{goal.category}</Badge>}
        </div>

        {/* Progress */}
        {progress !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-3 mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Attuale: {goal.currentValue} {goal.targetUnit}
                </span>
                <span>{progress}%</span>
                <span>
                  Obiettivo: {goal.targetValue} {goal.targetUnit}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dettagli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goal.startDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data inizio</span>
                <span>{goal.startDate}</span>
              </div>
            )}
            {goal.targetDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data obiettivo</span>
                <span>{goal.targetDate}</span>
              </div>
            )}
            {(() => {
              const meta = goal.metadata as Record<string, unknown> | null;
              const metricType = meta?.metricType;
              if (!metricType) return null;
              return (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metrica collegata</span>
                  <span>{String(metricType)}</span>
                </div>
              );
            })()}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creato</span>
              <span>
                {new Date(goal.createdAt).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
