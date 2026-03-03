"use client";

import { useTransition, useState } from "react";
import { upsertTaxProfile } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  profile: {
    regime: string | null;
    atecoCode: string | null;
    atecoDescription: string | null;
    coefficienteRedditività: string | null;
    inpsRate: string | null;
    inpsMinimum: string | null;
    taxRate: string | null;
    notes: string | null;
  } | null;
}

export function TaxProfileForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(!profile);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Modifica profilo
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await upsertTaxProfile({
        regime: fd.get("regime") || "forfettario",
        atecoCode: fd.get("atecoCode") || null,
        atecoDescription: fd.get("atecoDescription") || null,
        coefficienteRedditività: fd.get("coefficienteRedditività") || null,
        inpsRate: fd.get("inpsRate") || null,
        inpsMinimum: fd.get("inpsMinimum") || null,
        taxRate: fd.get("taxRate") || null,
        notes: fd.get("notes") || null,
      });
      setOpen(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="regime">Regime</Label>
          <Input id="regime" name="regime" defaultValue={profile?.regime ?? "forfettario"} />
        </div>
        <div>
          <Label htmlFor="atecoCode">Codice ATECO</Label>
          <Input
            id="atecoCode"
            name="atecoCode"
            defaultValue={profile?.atecoCode ?? ""}
            placeholder="62.01.00"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="atecoDescription">Descrizione ATECO</Label>
        <Input
          id="atecoDescription"
          name="atecoDescription"
          defaultValue={profile?.atecoDescription ?? ""}
          placeholder="Produzione di software"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <Label htmlFor="coefficienteRedditività">Coeff. Redd.</Label>
          <Input
            id="coefficienteRedditività"
            name="coefficienteRedditività"
            defaultValue={profile?.coefficienteRedditività ?? ""}
            placeholder="0.78"
          />
        </div>
        <div>
          <Label htmlFor="inpsRate">INPS Rate</Label>
          <Input
            id="inpsRate"
            name="inpsRate"
            defaultValue={profile?.inpsRate ?? ""}
            placeholder="0.2607"
          />
        </div>
        <div>
          <Label htmlFor="taxRate">Aliquota</Label>
          <Input
            id="taxRate"
            name="taxRate"
            defaultValue={profile?.taxRate ?? ""}
            placeholder="0.05"
          />
        </div>
        <div>
          <Label htmlFor="inpsMinimum">INPS Minimo</Label>
          <Input
            id="inpsMinimum"
            name="inpsMinimum"
            defaultValue={profile?.inpsMinimum ?? ""}
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Note</Label>
        <Input id="notes" name="notes" defaultValue={profile?.notes ?? ""} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvataggio..." : "Salva profilo"}
        </Button>
        {profile && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Annulla
          </Button>
        )}
      </div>
    </form>
  );
}
