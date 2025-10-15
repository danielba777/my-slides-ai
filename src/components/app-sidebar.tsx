"use client";
import { useTheme } from "next-themes";
import { IoHomeOutline, IoImagesOutline } from "react-icons/io5";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SidebarAccountSection } from "./app-sidebar-account";
import { AppLogo } from "./logo/AppLogo";

const startItems = [
  {
    title: "Home",
    url: "/dashboard/home",
    icon: IoHomeOutline,
  },
];

// Menu items.
const playgroundItems = [
  {
    title: "Slideshows",
    url: "/dashboard/slideshows",
    icon: IoImagesOutline,
  },
];

export function AppSidebar() {
  const { resolvedTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex justify-center gap-2 py-4">
          <AppLogo size={24} dark={resolvedTheme === "dark"} />
          <p className="text-base font-bold">SlidesCockpit</p>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {startItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="font-semibold">
                    <a href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span className="font-semibold">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Playground</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {playgroundItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="font-semibold">
                    <a href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span className="font-semibold">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarAccountSection />
      </SidebarFooter>
    </Sidebar>
  );
}
