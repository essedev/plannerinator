import { getSession } from "@/lib/auth";
import { getHealthDashboardData } from "@/features/health/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, Pill, Target, Weight } from "lucide-react";
import Link from "next/link";
import {
  calculateBMI,
  getBMICategory,
  formatMetricValue,
  calculateGoalProgress,
} from "@/features/health/helpers";
import { getHealthProfile } from "@/features/health/queries";

export default async function SaluteDashboardPage() {
  const session = (await getSession())!;
  const userId = session.user.id;

  const [dashboardData, profile] = await Promise.all([
    getHealthDashboardData(userId),
    getHealthProfile(userId),
  ]);

  const { activeProtocols, activeSupplementsCount, latestWeight, activeGoals } = dashboardData;

  // Calculate BMI if weight and height available
  let bmi: number | null = null;
  let bmiCategory: string | null = null;
  if (latestWeight && profile?.height) {
    bmi = calculateBMI(parseFloat(latestWeight.value), parseFloat(profile.height));
    if (bmi) bmiCategory = getBMICategory(bmi);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Salute</h1>
        <p className="text-muted-foreground mt-1">
          Monitora la tua salute, integratori e obiettivi.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolli attivi</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProtocols.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeSupplementsCount} integratori attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ultimo peso</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestWeight
                ? formatMetricValue(latestWeight.value, latestWeight.unit ?? "kg")
                : "—"}
            </div>
            {bmi && (
              <p className="text-xs text-muted-foreground">
                BMI: {bmi} ({bmiCategory})
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obiettivi attivi</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">obiettivi in corso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stato</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeProtocols.length > 0 ? "Attivo" : "Inattivo"}
            </div>
            <p className="text-xs text-muted-foreground">monitoraggio salute</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/salute/corpo">Registra metrica</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/salute/integratori/new">Nuovo protocollo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/salute/obiettivi/new">Nuovo obiettivo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/salute/routine">Routine di oggi</Link>
        </Button>
      </div>

      {/* Active Protocols */}
      {activeProtocols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Protocolli attivi</CardTitle>
            <CardDescription>I tuoi protocolli di integratori attualmente in uso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProtocols.map((protocol) => (
                <Link
                  key={protocol.id}
                  href={`/salute/integratori/${protocol.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{protocol.name}</p>
                    {protocol.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {protocol.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{protocol.supplementCount} integratori</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Obiettivi in corso</CardTitle>
            <CardDescription>I tuoi obiettivi salute attivi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const progress = calculateGoalProgress(goal.currentValue, goal.targetValue);
                return (
                  <Link
                    key={goal.id}
                    href={`/salute/obiettivi/${goal.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{goal.title}</p>
                      {goal.category && <Badge variant="outline">{goal.category}</Badge>}
                    </div>
                    {progress !== null && (
                      <div className="space-y-1">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {goal.currentValue} / {goal.targetValue} {goal.targetUnit}
                          {" — "}
                          {progress}%
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
