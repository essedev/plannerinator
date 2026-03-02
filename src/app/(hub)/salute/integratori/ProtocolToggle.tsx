"use client";

import { Switch } from "@/components/ui/switch";
import { updateProtocol } from "@/features/health/actions";
import { useTransition } from "react";

export function ProtocolToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          await updateProtocol(id, { isActive: checked });
        });
      }}
    />
  );
}
