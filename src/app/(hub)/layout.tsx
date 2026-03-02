import { AiChatDrawer } from "@/components/ai/AiChatDrawer";
import { AiChatTrigger } from "@/components/ai/AiChatTrigger";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";
import { CommandPalette } from "@/components/search/CommandPalette";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AiDrawerProvider } from "@/hooks/use-ai-drawer";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Dashboard layout - UNICO punto di controllo autenticazione per /dashboard/*
 *
 * Questo layout protegge TUTTE le route sotto /dashboard/ con una singola verifica.
 * Le singole pages NON devono ricontrollare la sessione - è garantita qui.
 *
 * Sicurezza:
 * - Chiama getSession() che valida completamente la sessione Better Auth
 * - Verifica firma del cookie, scadenza, e integrità del token
 * - Redirect a /auth se la sessione non è valida
 * - RBAC (controllo ruoli) gestito nei singoli componenti tramite RoleGate
 *
 * Layout:
 * - Sidebar collassabile (Cmd+B) con persistenza stato
 * - Full-width content area per dashboard ottimale
 * - Responsive con Sheet mobile
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  return (
    <AiDrawerProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          {/* Header con trigger e breadcrumbs */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <DashboardBreadcrumbs />

            {/* AI Chat Trigger */}
            <div className="ml-auto">
              <AiChatTrigger />
            </div>
          </header>

          {/* Main content - full width senza container */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 lg:p-8 min-w-0">{children}</div>
          </main>
        </SidebarInset>

        {/* Global Command Palette (Cmd+K) */}
        <CommandPalette />

        {/* AI Chat Drawer (Cmd+Shift+A) */}
        <AiChatDrawer />
      </SidebarProvider>
    </AiDrawerProvider>
  );
}
