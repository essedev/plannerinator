import { getSession } from "@/lib/auth";
import { getTaxProfile, getAnnualRevenues, getF24Payments } from "@/features/finance/queries";
import { formatCurrency, calculateForfettarioTax } from "@/features/finance/helpers";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaxProfileForm } from "./TaxProfileForm";
import { F24Actions } from "./F24Actions";
import { NewF24Form } from "./NewF24Form";
import { NewRevenueForm } from "./NewRevenueForm";

export default async function FiscalePage() {
  const session = (await getSession())!;

  const [profile, revenues, unpaidF24, paidF24] = await Promise.all([
    getTaxProfile(session.user.id),
    getAnnualRevenues(session.user.id),
    getF24Payments(session.user.id, false),
    getF24Payments(session.user.id, true),
  ]);

  // Simulate current year Forfettario if profile has rates
  let taxSimulation: ReturnType<typeof calculateForfettarioTax> | null = null;
  const currentYear = new Date().getFullYear();
  const currentRevenue = revenues.find((r) => r.year === currentYear);

  if (profile?.coefficienteRedditività && profile?.inpsRate && profile?.taxRate && currentRevenue) {
    taxSimulation = calculateForfettarioTax({
      revenue: parseFloat(currentRevenue.totalRevenue),
      coefficienteRedditività: parseFloat(profile.coefficienteRedditività),
      inpsRate: parseFloat(profile.inpsRate),
      taxRate: parseFloat(profile.taxRate),
      inpsMinimum: profile.inpsMinimum ? parseFloat(profile.inpsMinimum) : 0,
    });
  }

  return (
    <div>
      <PageHeader title="Fiscale" description="Profilo fiscale, F24 e revenue annuali." />

      <div className="space-y-6">
        {/* Tax Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profilo Fiscale</CardTitle>
            <CardDescription>
              {profile
                ? `Regime: ${profile.regime ?? "Forfettario"} | ATECO: ${profile.atecoCode ?? "—"}`
                : "Nessun profilo configurato. Compilalo per abilitare i calcoli fiscali."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Coeff. Redditivita</p>
                  <p className="font-mono text-sm">
                    {profile.coefficienteRedditività
                      ? `${(parseFloat(profile.coefficienteRedditività) * 100).toFixed(0)}%`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">INPS Rate</p>
                  <p className="font-mono text-sm">
                    {profile.inpsRate ? `${(parseFloat(profile.inpsRate) * 100).toFixed(2)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aliquota</p>
                  <p className="font-mono text-sm">
                    {profile.taxRate ? `${(parseFloat(profile.taxRate) * 100).toFixed(0)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">INPS Minimo</p>
                  <p className="font-mono text-sm">
                    {profile.inpsMinimum ? formatCurrency(profile.inpsMinimum) : "—"}
                  </p>
                </div>
              </div>
            )}
            <TaxProfileForm profile={profile} />
          </CardContent>
        </Card>

        {/* Forfettario Simulation */}
        {taxSimulation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Simulazione Forfettario {currentYear}</CardTitle>
              <CardDescription>
                Su fatturato {formatCurrency(currentRevenue!.totalRevenue)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Reddito Imponibile</p>
                  <p className="font-mono text-sm font-semibold">
                    {formatCurrency(taxSimulation.redditoImponibile)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contributi INPS</p>
                  <p className="font-mono text-sm text-red-600">
                    {formatCurrency(taxSimulation.contributiInps)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Imposta Sostitutiva</p>
                  <p className="font-mono text-sm text-red-600">
                    {formatCurrency(taxSimulation.impostaSostitutiva)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Totale Tasse</p>
                  <p className="font-mono text-sm font-semibold text-red-600">
                    {formatCurrency(taxSimulation.totaleTasse)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Netto Stimato</p>
                  <p className="font-mono text-sm font-semibold text-green-600">
                    {formatCurrency(taxSimulation.nettoStimato)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* F24 Payments - Unpaid */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">F24 da pagare</CardTitle>
                <CardDescription>
                  {unpaidF24.length === 0
                    ? "Nessun F24 in sospeso."
                    : `${unpaidF24.length} pagamento/i in sospeso`}
                </CardDescription>
              </div>
              {unpaidF24.length > 0 && (
                <Badge variant="destructive">
                  {formatCurrency(unpaidF24.reduce((s, f) => s + parseFloat(f.totalAmount), 0))}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {unpaidF24.length > 0 && (
              <div className="space-y-2 mb-4">
                {unpaidF24.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {new Date(f.date + "T00:00:00").toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {f.period && (
                        <span className="text-xs text-muted-foreground ml-2">({f.period})</span>
                      )}
                      {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-red-600">
                        {formatCurrency(f.totalAmount)}
                      </span>
                      <F24Actions id={f.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <NewF24Form />
          </CardContent>
        </Card>

        {/* F24 Payments - Paid */}
        {paidF24.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">F24 pagati</CardTitle>
              <CardDescription>{paidF24.length} pagamento/i completato/i</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paidF24.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 opacity-60"
                  >
                    <div>
                      <span className="text-sm">
                        {new Date(f.date + "T00:00:00").toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {f.period && (
                        <span className="text-xs text-muted-foreground ml-2">({f.period})</span>
                      )}
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(f.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Annual Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Annuali</CardTitle>
            <CardDescription>Fatturato per anno fiscale.</CardDescription>
          </CardHeader>
          <CardContent>
            {revenues.length > 0 && (
              <div className="space-y-2 mb-4">
                {revenues.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.year}</Badge>
                      {r.notes && <span className="text-xs text-muted-foreground">{r.notes}</span>}
                    </div>
                    <div className="flex items-center gap-4 font-mono text-sm">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Fatturato</p>
                        <p className="font-semibold">{formatCurrency(r.totalRevenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Spese</p>
                        <p>{formatCurrency(r.totalExpenses)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <NewRevenueForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
