import { getSession } from "@/lib/auth";
import { getBodyMetrics, getHealthProfile, getLatestMetricByType } from "@/features/health/queries";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateBMI, getBMICategory, formatMetricValue } from "@/features/health/helpers";
import { LogMetricForm } from "./LogMetricForm";
import { MetricRow } from "./MetricRow";

export default async function CorpoPage() {
  const session = (await getSession())!;
  const userId = session.user.id;

  const [metricsData, profile, latestWeight] = await Promise.all([
    getBodyMetrics(userId, { limit: 30 }),
    getHealthProfile(userId),
    getLatestMetricByType(userId, "weight"),
  ]);

  // Calculate BMI
  let bmi: number | null = null;
  let bmiCategory: string | null = null;
  if (latestWeight && profile?.height) {
    bmi = calculateBMI(parseFloat(latestWeight.value), parseFloat(profile.height));
    if (bmi) bmiCategory = getBMICategory(bmi);
  }

  return (
    <div>
      <PageHeader title="Corpo" description="Monitora le metriche del tuo corpo." />

      <div className="space-y-6">
        {/* BMI Card */}
        {bmi && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">BMI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold">{bmi}</span>
                <Badge variant={bmi >= 18.5 && bmi < 25 ? "default" : "secondary"}>
                  {bmiCategory}
                </Badge>
                {latestWeight && (
                  <span className="text-sm text-muted-foreground">
                    Peso: {formatMetricValue(latestWeight.value, latestWeight.unit ?? "kg")}
                    {" | "}Altezza: {profile?.height} cm
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Log metric form */}
        <LogMetricForm />

        {/* Metrics history */}
        <Card>
          <CardHeader>
            <CardTitle>Storico metriche</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsData.metrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nessuna metrica registrata. Usa il form qui sopra per iniziare.
              </p>
            ) : (
              <div className="space-y-2">
                {metricsData.metrics.map((metric) => (
                  <MetricRow key={metric.id} metric={metric} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
