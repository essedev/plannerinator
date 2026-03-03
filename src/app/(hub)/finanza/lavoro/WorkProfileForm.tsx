"use client";

import { useTransition, useState } from "react";
import { upsertWorkProfile } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  profile: {
    jobTitle: string | null;
    companyName: string | null;
    partitaIva: string | null;
    hourlyRate: string | null;
    monthlyRate: string | null;
    skills: unknown;
    specializations: unknown;
    notes: string | null;
  } | null;
}

export function WorkProfileForm({ profile }: Props) {
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

    const skillsStr = fd.get("skills") as string;
    const specsStr = fd.get("specializations") as string;

    startTransition(async () => {
      await upsertWorkProfile({
        jobTitle: fd.get("jobTitle") || null,
        companyName: fd.get("companyName") || null,
        partitaIva: fd.get("partitaIva") || null,
        hourlyRate: fd.get("hourlyRate") || null,
        monthlyRate: fd.get("monthlyRate") || null,
        skills: skillsStr
          ? skillsStr
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        specializations: specsStr
          ? specsStr
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        notes: fd.get("notes") || null,
      });
      setOpen(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="jobTitle">Ruolo</Label>
          <Input
            id="jobTitle"
            name="jobTitle"
            defaultValue={profile?.jobTitle ?? ""}
            placeholder="Software Developer"
          />
        </div>
        <div>
          <Label htmlFor="companyName">Azienda</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={profile?.companyName ?? ""}
            placeholder="Freelance"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="partitaIva">P.IVA</Label>
          <Input
            id="partitaIva"
            name="partitaIva"
            defaultValue={profile?.partitaIva ?? ""}
            placeholder="01234567890"
          />
        </div>
        <div>
          <Label htmlFor="hourlyRate">Tariffa Oraria</Label>
          <Input
            id="hourlyRate"
            name="hourlyRate"
            defaultValue={profile?.hourlyRate ?? ""}
            placeholder="50.00"
          />
        </div>
        <div>
          <Label htmlFor="monthlyRate">Tariffa Mensile</Label>
          <Input
            id="monthlyRate"
            name="monthlyRate"
            defaultValue={profile?.monthlyRate ?? ""}
            placeholder="3000.00"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="skills">Competenze (separate da virgola)</Label>
        <Input
          id="skills"
          name="skills"
          defaultValue={profile?.skills ? (profile.skills as string[]).join(", ") : ""}
          placeholder="TypeScript, React, Node.js"
        />
      </div>
      <div>
        <Label htmlFor="specializations">Specializzazioni (separate da virgola)</Label>
        <Input
          id="specializations"
          name="specializations"
          defaultValue={
            profile?.specializations ? (profile.specializations as string[]).join(", ") : ""
          }
          placeholder="Frontend, Full Stack"
        />
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
