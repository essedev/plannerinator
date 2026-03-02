"use client";

import { useState } from "react";
import { HubSwitcher } from "@/components/dashboard/HubSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";
import { hubConfigs, getActiveHub } from "@/lib/hub";
import type { AppUser } from "@/types/auth.d";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { state } = useSidebar();
  const user = session?.user as AppUser | undefined;

  const activeHubId = getActiveHub(pathname);
  const activeHub = hubConfigs[activeHubId];

  // Filtra nav items in base ai permessi
  const visibleItems = activeHub.navItems.filter((item) => {
    if (!item.permission) return true;
    if (!user) return false;
    return hasPermission(user.role, item.permission);
  });

  const isCollapsed = state === "collapsed";
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header — Hub Switcher */}
      <SidebarHeader className="flex h-16 border-b border-sidebar-border p-0">
        <div className="flex items-center px-2 w-full h-full">
          <HubSwitcher isCollapsed={isCollapsed} />
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarMenu className="gap-1 p-2">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== activeHub.basePath && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                  <Link href={item.href}>
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        {!isCollapsed && user ? (
          <div className="p-3 space-y-3">
            {/* User Info */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium leading-none truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              {user.role && (
                <div className="pt-1">
                  <Badge
                    variant={user.role === "admin" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              )}
            </div>

            <Separator className="bg-sidebar-border" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <span className="mr-auto text-xs text-muted-foreground">Actions</span>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutDialog(true)}
                aria-label="Logout"
                className="h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3">
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutDialog(true)}
                aria-label="Logout"
                className="h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma logout</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler uscire? Dovrai effettuare nuovamente l&apos;accesso per
              continuare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Esci</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
