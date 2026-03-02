import { getSession } from "@/lib/auth";
import { getDailyRoutine } from "@/features/health/queries";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Sunset, Moon, Clock } from "lucide-react";

const timeSlots = [
  { key: "morning", label: "Mattina", icon: Sun },
  { key: "afternoon", label: "Pomeriggio", icon: Sunset },
  { key: "evening", label: "Sera", icon: Moon },
  { key: "other", label: "Altro", icon: Clock },
] as const;

const frequencyLabels: Record<string, string> = {
  daily: "Giornaliero",
  twice_daily: "2x/giorno",
  weekly: "Settimanale",
  as_needed: "Al bisogno",
  custom: "Personalizzato",
};

export default async function RoutinePage() {
  const session = (await getSession())!;
  const routine = await getDailyRoutine(session.user.id);

  const totalSupplements = Object.values(routine).reduce((sum, items) => sum + items.length, 0);

  return (
    <div>
      <PageHeader
        title="Routine giornaliera"
        description="Integratori da prendere oggi, raggruppati per orario."
      />

      {totalSupplements === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nessun integratore nella routine giornaliera.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Aggiungi integratori ai tuoi protocolli attivi per vederli qui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {timeSlots.map(({ key, label, icon: Icon }) => {
            const items = routine[key];
            if (items.length === 0) return null;

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5" />
                    {label}
                    <Badge variant="secondary" className="ml-auto">
                      {items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.supplement.id}
                        className="flex items-center gap-4 p-3 rounded-lg border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.supplement.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.supplement.dosage && (
                              <Badge variant="outline" className="text-xs">
                                {item.supplement.dosage}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {frequencyLabels[item.supplement.frequency] ??
                                item.supplement.frequency}
                            </Badge>
                            {item.supplement.brand && (
                              <Badge variant="outline" className="text-xs">
                                {item.supplement.brand}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {item.protocolName}
                        </span>
                      </div>
                    ))}
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
