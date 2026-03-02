"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { hubConfigs, getActiveHub, type HubId } from "@/lib/hub";
import { ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const hubOrder: HubId[] = ["planner", "salute", "finanza"];

export function HubSwitcher({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeHubId = getActiveHub(pathname);
  const activeHub = hubConfigs[activeHubId];
  const ActiveIcon = activeHub.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ActiveIcon className="size-4" />
          </div>
          {!isCollapsed && (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeHub.label}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </>
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
        align="start"
        side={isCollapsed ? "right" : "bottom"}
        sideOffset={4}
      >
        {hubOrder.map((hubId) => {
          const hub = hubConfigs[hubId];
          const Icon = hub.icon;
          const isActive = hubId === activeHubId;

          return (
            <DropdownMenuItem
              key={hubId}
              onClick={() => router.push(hub.basePath)}
              className={isActive ? "bg-accent" : undefined}
            >
              <Icon className="mr-2 size-4" />
              {hub.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
