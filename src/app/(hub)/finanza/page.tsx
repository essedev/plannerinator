import { getSession } from "@/lib/auth";
import { getFinanceDashboardData } from "@/features/finance/queries";
import { formatCurrency } from "@/features/finance/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Receipt,
  Landmark,
  PiggyBank,
  BarChart3,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { calculateGoalProgress } from "@/features/health/helpers";

export default async function FinanzaPage() {
  const session = (await getSession())!;
  const data = await getFinanceDashboardData(session.user.id);

  const netMonth = data.monthlyIncome - data.monthlyExpenses;

  return (
    <div>
      <div className="pb-6 mb-8 border-b">
        <h1 className="text-4xl font-bold tracking-tight">Finanza</h1>
        <p className="text-muted-foreground text-lg mt-2">Gestisci le tue finanze personali.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entrate mese</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.monthlyIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uscite mese</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.monthlyExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Netto mese</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netMonth >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(netMonth)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conti attivi</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.accounts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button asChild size="sm">
          <Link href="/finanza/storico/new">
            <Plus className="h-4 w-4 mr-1" />
            Nuova transazione
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/finanza/storico">
            <Receipt className="h-4 w-4 mr-1" />
            Storico
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/finanza/spese-fisse">
            <Landmark className="h-4 w-4 mr-1" />
            Spese fisse
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/finanza/spese-variabili">
            <PiggyBank className="h-4 w-4 mr-1" />
            Budget
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/finanza/investimenti">
            <TrendingUp className="h-4 w-4 mr-1" />
            Investimenti
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/finanza/obiettivi">
            <Target className="h-4 w-4 mr-1" />
            Obiettivi
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Obiettivi attivi</CardTitle>
          </CardHeader>
          <CardContent>
            {data.activeGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun obiettivo attivo.</p>
            ) : (
              <div className="space-y-4">
                {data.activeGoals.map((g) => {
                  const progress = calculateGoalProgress(g.currentValue, g.targetValue);
                  return (
                    <Link
                      key={g.id}
                      href={`/finanza/obiettivi/${g.id}`}
                      className="block hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{g.title}</span>
                        {g.category && (
                          <Badge variant="outline" className="text-xs">
                            {g.category}
                          </Badge>
                        )}
                      </div>
                      {progress !== null && (
                        <>
                          <Progress value={progress} className="h-2 mb-1" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {g.currentValue} {g.targetUnit}
                            </span>
                            <span>{progress}%</span>
                            <span>
                              {g.targetValue} {g.targetUnit}
                            </span>
                          </div>
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* F24 & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scadenze</CardTitle>
          </CardHeader>
          <CardContent>
            {data.unpaidF24Count > 0 ? (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{data.unpaidF24Count}</Badge>
                <span className="text-sm">F24 da pagare</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nessuna scadenza imminente.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
