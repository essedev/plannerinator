"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/features/users/actions";
import { toast } from "sonner";
import type { Role } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RoleSelectorProps {
  userId: string;
  currentRole: Role;
  disabled?: boolean;
}

const ROLES: Role[] = ["user", "admin"];

const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  admin: "Admin",
};

/**
 * Client component per selezionare il ruolo di un utente.
 */
export function RoleSelector({ userId, currentRole, disabled }: RoleSelectorProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (newRole: Role) => {
    if (newRole === currentRole) return;

    setIsUpdating(true);

    try {
      await updateUserRole(userId, newRole);
      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select value={currentRole} onValueChange={handleRoleChange} disabled={disabled || isUpdating}>
      <SelectTrigger className="w-[130px]">
        <SelectValue>
          <Badge variant={currentRole === "admin" ? "default" : "outline"}>
            {ROLE_LABELS[currentRole]}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
