import { getSession } from "@/lib/auth";
import { getProtocols } from "@/features/health/queries";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ProtocolToggle } from "./ProtocolToggle";

export default async function IntegratoriPage() {
  const session = (await getSession())!;
  const protocols = await getProtocols(session.user.id);

  return (
    <div>
      <PageHeader
        title="Integratori"
        description="Gestisci i tuoi protocolli di integrazione."
        actions={
          <Button asChild>
            <Link href="/salute/integratori/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo protocollo
            </Link>
          </Button>
        }
      />

      {protocols.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nessun protocollo creato.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/salute/integratori/new">Crea il tuo primo protocollo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {protocols.map((protocol) => (
            <Card key={protocol.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Link href={`/salute/integratori/${protocol.id}`}>
                    <CardTitle className="hover:underline">{protocol.name}</CardTitle>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant={protocol.isActive ? "default" : "secondary"}>
                      {protocol.isActive ? "Attivo" : "Inattivo"}
                    </Badge>
                    <ProtocolToggle id={protocol.id} isActive={protocol.isActive} />
                  </div>
                </div>
                {protocol.description && (
                  <p className="text-sm text-muted-foreground">{protocol.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {protocol.supplementCount} integratori
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/salute/integratori/${protocol.id}`}>Dettagli</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
