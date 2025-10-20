"use client";
import {
  CalendarClock,
  FileCheck,
  Home,
  Images,
  TestTube2,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

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

interface SidebarItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const startItems: SidebarItem[] = [
  {
    title: "Home",
    url: "/dashboard/home",
    icon: Home,
  },
];

const playgroundItems: SidebarItem[] = [
  {
    title: "Slideshows",
    url: "/dashboard/slideshows",
    icon: Images,
  },
];

const configurationItems: SidebarItem[] = [
  {
    title: "Connections",
    url: "/dashboard/connections",
    icon: UserPen,
  },
];

const postItems: SidebarItem[] = [
  {
    title: "Scheduled",
    url: "/dashboard/posts/scheduled",
    icon: CalendarClock,
  },
  {
    title: "Posted",
    url: "/dashboard/posts/posted",
    icon: FileCheck,
  },
];

const debugItems: SidebarItem[] = [
  {
    title: "TikTok Posting",
    url: "/dashboard/tests/tiktok-post",
    icon: TestTube2,
  },
  {
    title: "TikTok Scheduling",
    url: "/dashboard/tests/tiktok-schedule",
    icon: CalendarClock,
  },
];

export function AppSidebar() {
  const { resolvedTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex justify-center items-center gap-2 py-4">
          <AppLogo size={32} dark={resolvedTheme === "dark"} />
          <p className="text-lg font-bold">SlidesCockpit</p>
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
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configurationItems.map((item) => (
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
          <SidebarGroupLabel>Posts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {postItems.map((item) => (
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
          <SidebarGroupLabel className="text-red-500">DEBUG</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {debugItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="font-semibold">
                    <a href={item.url}>
                      <item.icon className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-red-500">
                        {item.title}
                      </span>
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
