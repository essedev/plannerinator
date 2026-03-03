import { getSession } from "@/lib/auth";
import { getBudgetsForMonth, getCategories } from "@/features/finance/queries";
import { formatCurrency, calculateBudgetProgress, getMonthKey } from "@/features/finance/helpers";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BudgetForm } from "./BudgetForm";

export default async function SpeseVariabiliPage() {
  const session = (await getSession())!;
  const currentMonth = getMonthKey(new Date().toISOString().slice(0, 10));

  const [budgets, categories] = await Promise.all([
    getBudgetsForMonth(session.user.id, currentMonth),
    getCategories(session.user.id, "expense"),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const totalPlanned = budgets.reduce((s, b) => s + parseFloat(b.plannedAmount), 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  const monthLabel = new Date(currentMonth + "T00:00:00").toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <PageHeader
        title="Budget"
        description={`${monthLabel} — Pianificato: ${formatCurrency(totalPlanned)} | Speso: ${formatCurrency(totalSpent)}`}
      />

      {budgets.length === 0 && categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-2">
              Crea prima delle categorie di spesa, poi imposta il budget mensile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Existing budgets */}
          {budgets.length > 0 && (
            <div className="space-y-3">
              {budgets.map((b) => {
                const planned = parseFloat(b.plannedAmount);
                const progress = calculateBudgetProgress(b.spent, planned);
                const isOver = b.spent > planned;

                return (
                  <Card key={b.id}>
                    <CardContent className="py-4 px-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">
                          {categoryMap.get(b.categoryId) ?? "Categoria"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(b.spent)} / {formatCurrency(planned)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(progress, 100)}
                        className={`h-2 ${isOver ? "[&>div]:bg-red-500" : ""}`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{progress}%</span>
                        {isOver && (
                          <span className="text-red-500">
                            Sforato di {formatCurrency(b.spent - planned)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add budget form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aggiungi budget</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetForm
                categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                month={currentMonth}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
