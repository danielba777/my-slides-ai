"use client";

import { Settings } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarSettingsButton() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/dashboard/account/settings");

  return (
    <SidebarMenu className="text-muted-foreground/80">
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="font-semibold text-muted-foreground/80 bg-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          isActive={isActive}
          tooltip="Settings"
        >
          <a href="/dashboard/account/settings">
            <Settings className="h-5 w-5" />
            <span className="font-semibold">Settings</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
