import { getSession } from "@/lib/auth";
import {
  getBankAccounts,
  getAccountBalance,
  getInvestments,
  getCryptoHoldings,
  getFinanceSettings,
} from "@/features/finance/queries";
import { formatCurrency, calculateNetPatrimony } from "@/features/finance/helpers";
import { getCryptoPrices } from "@/features/finance/coingecko";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const accountTypeLabels: Record<string, string> = {
  checking: "Conto Corrente",
  savings: "Risparmio",
  cash: "Contante",
  investment: "Investimento",
  credit_card: "Carta di Credito",
  other: "Altro",
};

const investmentTypeLabels: Record<string, string> = {
  etf: "ETF",
  stock: "Azioni",
  bond: "Obbligazioni",
  fund: "Fondo",
  other: "Altro",
};

export default async function PatrimonioPage() {
  const session = (await getSession())!;

  const [accounts, investments, crypto, settings] = await Promise.all([
    getBankAccounts(session.user.id, true),
    getInvestments(session.user.id),
    getCryptoHoldings(session.user.id),
    getFinanceSettings(session.user.id),
  ]);

  // Calculate balances for all accounts
  const accountBalances = await Promise.all(
    accounts.map(async (a) => {
      const b = await getAccountBalance(a.id, session.user.id);
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        balance: b?.currentBalance ?? 0,
      };
    })
  );

  const investmentValues = investments.map((i) =>
    i.currentValue ? parseFloat(i.currentValue) : 0
  );

  // Fetch live crypto prices from CoinGecko
  const cryptoSymbols = crypto.map((c) => c.symbol);
  const livePrices = cryptoSymbols.length > 0 ? await getCryptoPrices(cryptoSymbols) : {};

  const cryptoValues = crypto.map((c) => {
    const livePrice = livePrices[c.symbol.toUpperCase()];
    if (livePrice) {
      return parseFloat(c.quantity) * livePrice;
    }
    // Fallback to purchase price if no live price
    return c.purchasePrice ? parseFloat(c.quantity) * parseFloat(c.purchasePrice) : 0;
  });

  const totalAccounts = accountBalances.reduce((s, a) => s + a.balance, 0);
  const totalInvestments = investmentValues.reduce((s, v) => s + v, 0);
  const totalCrypto = cryptoValues.reduce((s, v) => s + v, 0);
  const netWorth = calculateNetPatrimony({
    accountBalances: accountBalances.map((a) => a.balance),
    investmentValues,
    cryptoValues,
  });

  // Settings data
  const pensionFund = settings?.pensionFund as {
    fundName?: string;
    monthlyContribution?: number;
    totalAccrued?: number;
    projectedAt67?: number;
  } | null;

  const riskProfile = settings?.riskProfile as {
    overallScore?: number;
    factors?: { name: string; score: number; notes?: string }[];
  } | null;

  return (
    <div>
      <PageHeader title="Patrimonio" description="Panoramica del patrimonio netto." />

      <div className="space-y-6">
        {/* Net Worth Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Liquidita</p>
              <p className="text-xl font-semibold font-mono">{formatCurrency(totalAccounts)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Investimenti</p>
              <p className="text-xl font-semibold font-mono">{formatCurrency(totalInvestments)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Crypto</p>
              <p className="text-xl font-semibold font-mono">{formatCurrency(totalCrypto)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Patrimonio Netto</p>
              <p
                className={`text-xl font-bold font-mono ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(netWorth)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conti</CardTitle>
            <CardDescription>{accountBalances.length} conto/i attivo/i</CardDescription>
          </CardHeader>
          <CardContent>
            {accountBalances.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun conto attivo.</p>
            ) : (
              <div className="space-y-2">
                {accountBalances.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{a.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {accountTypeLabels[a.type] ?? a.type}
                      </Badge>
                    </div>
                    <span
                      className={`font-mono text-sm font-semibold ${a.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(a.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investments Breakdown */}
        {investments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investimenti</CardTitle>
              <CardDescription>{investments.length} posizione/i</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {investments.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{inv.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {investmentTypeLabels[inv.type] ?? inv.type}
                      </Badge>
                      {inv.ticker && (
                        <span className="text-xs font-mono text-muted-foreground">
                          {inv.ticker}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-semibold">
                        {inv.currentValue ? formatCurrency(inv.currentValue) : "—"}
                      </span>
                      {inv.quantity && (
                        <p className="text-xs text-muted-foreground">{inv.quantity} unita</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crypto Breakdown */}
        {crypto.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crypto</CardTitle>
              <CardDescription>{crypto.length} holding/s</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {crypto.map((c, idx) => {
                  const livePrice = livePrices[c.symbol.toUpperCase()];
                  const totalValue = cryptoValues[idx];
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold font-mono">{c.symbol}</span>
                        <span className="text-sm text-muted-foreground">{c.name}</span>
                        {c.exchange && (
                          <Badge variant="outline" className="text-xs">
                            {c.exchange}
                          </Badge>
                        )}
                        {livePrice && (
                          <span className="text-xs text-muted-foreground">
                            @ {formatCurrency(livePrice)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm font-semibold">
                          {totalValue ? formatCurrency(totalValue) : "—"}
                        </span>
                        <p className="text-xs text-muted-foreground font-mono">
                          {c.quantity} {c.symbol}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pension Fund */}
        {pensionFund && (pensionFund.fundName || pensionFund.totalAccrued) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fondo Pensione</CardTitle>
              {pensionFund.fundName && <CardDescription>{pensionFund.fundName}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {pensionFund.monthlyContribution != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Contributo Mensile</p>
                    <p className="font-mono text-sm">
                      {formatCurrency(pensionFund.monthlyContribution)}
                    </p>
                  </div>
                )}
                {pensionFund.totalAccrued != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Totale Maturato</p>
                    <p className="font-mono text-sm font-semibold">
                      {formatCurrency(pensionFund.totalAccrued)}
                    </p>
                  </div>
                )}
                {pensionFund.projectedAt67 != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Proiezione a 67 anni</p>
                    <p className="font-mono text-sm">{formatCurrency(pensionFund.projectedAt67)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Profile */}
        {riskProfile && riskProfile.overallScore != null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profilo di Rischio</CardTitle>
              <CardDescription>Score complessivo: {riskProfile.overallScore}/10</CardDescription>
            </CardHeader>
            <CardContent>
              {riskProfile.factors && riskProfile.factors.length > 0 && (
                <div className="space-y-2">
                  {riskProfile.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-sm">{f.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(f.score / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono w-6 text-right">{f.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
