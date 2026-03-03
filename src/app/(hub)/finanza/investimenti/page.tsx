import { getSession } from "@/lib/auth";
import { getInvestments, getCryptoHoldings } from "@/features/finance/queries";
import { formatCurrency } from "@/features/finance/helpers";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  etf: "ETF",
  stock: "Azione",
  bond: "Obbligazione",
  fund: "Fondo",
  other: "Altro",
};

export default async function InvestimentiPage() {
  const session = (await getSession())!;

  const [investments, cryptoHoldings] = await Promise.all([
    getInvestments(session.user.id),
    getCryptoHoldings(session.user.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Investimenti"
        description="Portfolio investimenti e crypto."
        actions={
          <Button asChild size="sm">
            <Link href="/finanza/investimenti/new">
              <Plus className="h-4 w-4 mr-1" />
              Nuovo
            </Link>
          </Button>
        }
      />

      {investments.length === 0 && cryptoHoldings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nessun investimento registrato.</p>
            <Button asChild>
              <Link href="/finanza/investimenti/new">Aggiungi il primo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Traditional Investments */}
          {investments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Investimenti tradizionali</h2>
              <div className="space-y-2">
                {investments.map((inv) => (
                  <Card key={inv.id}>
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{inv.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[inv.type] ?? inv.type}
                          </Badge>
                          {inv.ticker && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {inv.ticker}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {inv.quantity && <span>Qty: {inv.quantity}</span>}
                          {inv.purchaseDate && (
                            <span className="ml-2">
                              Acquisto:{" "}
                              {new Date(inv.purchaseDate + "T00:00:00").toLocaleDateString(
                                "it-IT",
                                { day: "numeric", month: "short", year: "numeric" }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {inv.currentValue && (
                          <div className="font-mono font-semibold text-sm">
                            {formatCurrency(inv.currentValue)}
                          </div>
                        )}
                        {inv.purchasePrice && (
                          <div className="text-xs text-muted-foreground">
                            Costo: {formatCurrency(inv.purchasePrice)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Crypto */}
          {cryptoHoldings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Crypto</h2>
              <div className="space-y-2">
                {cryptoHoldings.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{c.name}</span>
                          <Badge variant="secondary" className="text-xs font-mono">
                            {c.symbol}
                          </Badge>
                          {c.exchange && (
                            <span className="text-xs text-muted-foreground">{c.exchange}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Qty: {c.quantity}
                          {c.walletType && <span className="ml-2">({c.walletType})</span>}
                        </div>
                      </div>
                      {c.purchasePrice && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            Costo: {formatCurrency(c.purchasePrice)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
