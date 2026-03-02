"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Mapping dei segmenti path a label leggibili
 */
const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  events: "Events",
  notes: "Notes",
  projects: "Projects",
  profile: "Profile",
  users: "Users",
  new: "New",
  salute: "Salute",
  integratori: "Integratori",
  corpo: "Corpo",
  routine: "Routine",
  obiettivi: "Obiettivi",
  finanza: "Finanza",
};

/**
 * Genera breadcrumbs intelligenti dal pathname corrente
 */
function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string; isLast: boolean }[] = [];

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Skip UUID/ID segments - li sostituiamo con label generica
    if (segment.match(/^[a-f0-9-]{36}$/i) || segment.match(/^\d+$/)) {
      breadcrumbs.push({
        label: "Details",
        href: currentPath,
        isLast,
      });
      return;
    }

    // Usa label custom o fallback al segmento capitalizzato
    const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbs.push({
      label,
      href: currentPath,
      isLast,
    });
  });

  return breadcrumbs;
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
