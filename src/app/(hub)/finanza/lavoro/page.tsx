import { getSession } from "@/lib/auth";
import { getWorkProfile, getClients, getRecurringInvoices } from "@/features/finance/queries";
import { formatCurrency, normalizeToMonthly } from "@/features/finance/helpers";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkProfileForm } from "./WorkProfileForm";
import { NewClientForm } from "./NewClientForm";
import { NewInvoiceForm } from "./NewInvoiceForm";

const frequencyLabels: Record<string, string> = {
  monthly: "Mensile",
  bimonthly: "Bimestrale",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
  annual: "Annuale",
};

export default async function LavoroPage() {
  const session = (await getSession())!;

  const [profile, clients, invoices] = await Promise.all([
    getWorkProfile(session.user.id),
    getClients(session.user.id),
    getRecurringInvoices(session.user.id),
  ]);

  const activeClients = clients.filter((c) => c.isActive);
  const monthlyRecurring = invoices
    .filter((i) => i.isActive)
    .reduce((s, i) => s + normalizeToMonthly(i.amount, i.frequency), 0);

  // Build client map for invoices
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div>
      <PageHeader
        title="Lavoro"
        description="Profilo professionale, clienti e fatture ricorrenti."
      />

      <div className="space-y-6">
        {/* Work Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profilo Professionale</CardTitle>
            <CardDescription>
              {profile
                ? [profile.jobTitle, profile.companyName].filter(Boolean).join(" — ") ||
                  "Profilo configurato"
                : "Nessun profilo configurato."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile && (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {profile.partitaIva && (
                    <div>
                      <p className="text-xs text-muted-foreground">P.IVA</p>
                      <p className="font-mono text-sm">{profile.partitaIva}</p>
                    </div>
                  )}
                  {profile.hourlyRate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tariffa Oraria</p>
                      <p className="font-mono text-sm">{formatCurrency(profile.hourlyRate)}/h</p>
                    </div>
                  )}
                  {profile.monthlyRate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tariffa Mensile</p>
                      <p className="font-mono text-sm">
                        {formatCurrency(profile.monthlyRate)}/mese
                      </p>
                    </div>
                  )}
                </div>

                {profile.skills && (profile.skills as string[]).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Competenze</p>
                    <div className="flex flex-wrap gap-1">
                      {(profile.skills as string[]).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.specializations && (profile.specializations as string[]).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Specializzazioni</p>
                    <div className="flex flex-wrap gap-1">
                      {(profile.specializations as string[]).map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <WorkProfileForm profile={profile} />
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clienti</CardTitle>
            <CardDescription>
              {activeClients.length} cliente/i attivo/i su {clients.length} totali
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length > 0 && (
              <div className="space-y-2 mb-4">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${!c.isActive ? "text-muted-foreground line-through" : ""}`}
                      >
                        {c.name}
                      </span>
                      {c.company && (
                        <span className="text-xs text-muted-foreground">({c.company})</span>
                      )}
                      {!c.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Inattivo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {c.defaultRate && (
                        <span className="font-mono text-sm">{formatCurrency(c.defaultRate)}</span>
                      )}
                      {c.email && <span className="text-xs text-muted-foreground">{c.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <NewClientForm />
          </CardContent>
        </Card>

        {/* Recurring Invoices */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Fatture Ricorrenti</CardTitle>
                <CardDescription>
                  {invoices.length === 0
                    ? "Nessuna fattura ricorrente configurata."
                    : `${invoices.length} fattura/e — ${formatCurrency(monthlyRecurring)}/mese totale`}
                </CardDescription>
              </div>
              {monthlyRecurring > 0 && (
                <Badge variant="secondary">{formatCurrency(monthlyRecurring)}/mese</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 && (
              <div className="space-y-2 mb-4">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <span
                        className={`text-sm font-medium ${!inv.isActive ? "text-muted-foreground line-through" : ""}`}
                      >
                        {inv.description}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {clientMap.get(inv.clientId) ?? "—"}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {frequencyLabels[inv.frequency] ?? inv.frequency}
                        </Badge>
                        {inv.nextDueDate && (
                          <span className="text-xs text-muted-foreground">
                            Prossima:{" "}
                            {new Date(inv.nextDueDate + "T00:00:00").toLocaleDateString("it-IT", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold text-green-600">
                      {formatCurrency(inv.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {clients.length > 0 && <NewInvoiceForm clients={clients} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
