import { getSession } from "@/lib/auth";
import { getProtocolWithSupplements } from "@/features/health/queries";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { DeleteProtocolButton } from "./DeleteProtocolButton";
import { AddSupplementForm } from "./AddSupplementForm";
import { SupplementRow } from "./SupplementRow";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProtocolDetailPage({ params }: Props) {
  const { id } = await params;
  const session = (await getSession())!;
  const protocol = await getProtocolWithSupplements(id, session.user.id);

  if (!protocol) notFound();

  return (
    <div>
      <PageHeader
        title={protocol.name}
        description={protocol.description ?? undefined}
        backButton
        actions={<DeleteProtocolButton id={protocol.id} />}
      />

      <div className="space-y-6">
        {/* Protocol info */}
        <div className="flex items-center gap-2">
          <Badge variant={protocol.isActive ? "default" : "secondary"}>
            {protocol.isActive ? "Attivo" : "Inattivo"}
          </Badge>
          {protocol.startDate && (
            <span className="text-sm text-muted-foreground">Dal {protocol.startDate}</span>
          )}
          {protocol.endDate && (
            <span className="text-sm text-muted-foreground">al {protocol.endDate}</span>
          )}
        </div>

        {/* Supplements list */}
        <Card>
          <CardHeader>
            <CardTitle>Integratori ({protocol.supplements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {protocol.supplements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nessun integratore in questo protocollo.
              </p>
            ) : (
              <div className="space-y-3">
                {protocol.supplements.map((s) => (
                  <SupplementRow key={s.id} supplement={s} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add supplement form */}
        <AddSupplementForm protocolId={protocol.id} />
      </div>
    </div>
  );
}
