import { getSession } from "@/lib/auth";
import { getTransactions, getCategories } from "@/features/finance/queries";
import { formatCurrency } from "@/features/finance/helpers";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  income: "Entrata",
  expense: "Uscita",
  transfer: "Trasferimento",
};

const typeColors: Record<string, string> = {
  income: "text-green-600",
  expense: "text-red-600",
  transfer: "text-blue-600",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StoricoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = (await getSession())!;

  const filters: Record<string, unknown> = {};
  if (sp.type && typeof sp.type === "string") filters.type = sp.type;
  if (sp.from && typeof sp.from === "string") filters.from = sp.from;
  if (sp.to && typeof sp.to === "string") filters.to = sp.to;

  const [{ transactions, pagination }, categories] = await Promise.all([
    getTransactions(session.user.id, filters),
    getCategories(session.user.id),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <PageHeader
        title="Storico"
        description="Tutte le transazioni registrate."
        actions={
          <Button asChild size="sm">
            <Link href="/finanza/storico/new">
              <Plus className="h-4 w-4 mr-1" />
              Nuova
            </Link>
          </Button>
        }
      />

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nessuna transazione registrata.</p>
            <Button asChild>
              <Link href="/finanza/storico/new">Registra la prima transazione</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {t.description || "Transazione"}
                    </span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {typeLabels[t.type] ?? t.type}
                    </Badge>
                    {t.categoryId && categoryMap.has(t.categoryId) && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {categoryMap.get(t.categoryId)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(t.date + "T00:00:00").toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {t.notes && <span className="ml-2">{t.notes}</span>}
                  </div>
                </div>
                <span className={`font-mono font-semibold text-sm ${typeColors[t.type]}`}>
                  {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                  {formatCurrency(t.amount)}
                </span>
              </CardContent>
            </Card>
          ))}
          {pagination.total > pagination.limit && (
            <p className="text-center text-sm text-muted-foreground pt-4">
              Mostrate {transactions.length} di {pagination.total} transazioni.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
