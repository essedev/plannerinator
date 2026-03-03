import { getSession } from "@/lib/auth";
import { getFixedExpenseGroups } from "@/features/finance/queries";
import { formatCurrency, normalizeToMonthly } from "@/features/finance/helpers";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AddExpenseForm } from "./AddExpenseForm";

const frequencyLabels: Record<string, string> = {
  monthly: "Mensile",
  bimonthly: "Bimestrale",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
  annual: "Annuale",
};

export default async function SpeseFissePage() {
  const session = (await getSession())!;
  const groups = await getFixedExpenseGroups(session.user.id);

  const totalMonthly = groups.reduce((sum, g) => {
    return (
      sum +
      g.expenses
        .filter((e) => e.isActive)
        .reduce((s, e) => s + normalizeToMonthly(e.amount, e.frequency), 0)
    );
  }, 0);

  return (
    <div>
      <PageHeader
        title="Spese fisse"
        description={`Costo mensile totale: ${formatCurrency(totalMonthly)}`}
        actions={
          <Button asChild size="sm">
            <Link href="/finanza/spese-fisse/new">
              <Plus className="h-4 w-4 mr-1" />
              Nuovo gruppo
            </Link>
          </Button>
        }
      />

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nessun gruppo di spese fisse creato.</p>
            <Button asChild>
              <Link href="/finanza/spese-fisse/new">Crea il primo gruppo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const groupMonthly = group.expenses
              .filter((e) => e.isActive)
              .reduce((s, e) => s + normalizeToMonthly(e.amount, e.frequency), 0);

            return (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.description && <CardDescription>{group.description}</CardDescription>}
                    </div>
                    <Badge variant="secondary">{formatCurrency(groupMonthly)}/mese</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.expenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground mb-4">
                      Nessuna spesa in questo gruppo.
                    </p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {group.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${!exp.isActive ? "text-muted-foreground line-through" : ""}`}
                            >
                              {exp.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {frequencyLabels[exp.frequency] ?? exp.frequency}
                            </Badge>
                            {exp.dueDay && (
                              <span className="text-xs text-muted-foreground">g. {exp.dueDay}</span>
                            )}
                          </div>
                          <span className="font-mono text-sm">{formatCurrency(exp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <AddExpenseForm groupId={group.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
