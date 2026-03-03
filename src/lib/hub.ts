/**
 * Hub System Configuration
 *
 * Defines hub types, configs, and utility functions for multi-section navigation.
 * Uses URL-based approach — the pathname determines the active hub.
 */

import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  Heart,
  LayoutDashboard,
  Tag,
  Trash2,
  UserCircle,
  Users,
  Wallet,
  Activity,
  Pill,
  Target,
  ClipboardList,
  Receipt,
  Landmark,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

// ============================================
// TYPES
// ============================================

export type HubId = "planner" | "salute" | "finanza";

export interface HubNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
}

export interface HubConfig {
  id: HubId;
  label: string;
  icon: LucideIcon;
  basePath: string;
  navItems: HubNavItem[];
}

// ============================================
// HUB CONFIGURATIONS
// ============================================

export const hubConfigs: Record<HubId, HubConfig> = {
  planner: {
    id: "planner",
    label: "Planner",
    icon: LayoutDashboard,
    basePath: "/dashboard",
    navItems: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
      { label: "Events", href: "/dashboard/events", icon: Calendar },
      { label: "Notes", href: "/dashboard/notes", icon: FileText },
      { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
      { label: "Tags", href: "/dashboard/tags", icon: Tag },
      { label: "Trash", href: "/dashboard/trash", icon: Trash2 },
      { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
      { label: "Users", href: "/dashboard/users", icon: Users, permission: "manage_users" },
    ],
  },
  salute: {
    id: "salute",
    label: "Salute",
    icon: Heart,
    basePath: "/salute",
    navItems: [
      { label: "Overview", href: "/salute", icon: Activity },
      { label: "Integratori", href: "/salute/integratori", icon: Pill },
      { label: "Corpo", href: "/salute/corpo", icon: Heart },
      { label: "Routine", href: "/salute/routine", icon: ClipboardList },
      { label: "Obiettivi", href: "/salute/obiettivi", icon: Target },
    ],
  },
  finanza: {
    id: "finanza",
    label: "Finanza",
    icon: Wallet,
    basePath: "/finanza",
    navItems: [
      { label: "Overview", href: "/finanza", icon: Wallet },
      { label: "Storico", href: "/finanza/storico", icon: Receipt },
      { label: "Spese fisse", href: "/finanza/spese-fisse", icon: Landmark },
      { label: "Budget", href: "/finanza/spese-variabili", icon: PiggyBank },
      { label: "Investimenti", href: "/finanza/investimenti", icon: TrendingUp },
      { label: "Obiettivi", href: "/finanza/obiettivi", icon: Target },
    ],
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Determine the active hub from the current pathname.
 * Inspects the first path segment:
 * - /dashboard/* → "planner"
 * - /salute/*   → "salute"
 * - /finanza/*  → "finanza"
 * - fallback    → "planner"
 */
export function getActiveHub(pathname: string): HubId {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  switch (firstSegment) {
    case "salute":
      return "salute";
    case "finanza":
      return "finanza";
    case "dashboard":
    default:
      return "planner";
  }
}
