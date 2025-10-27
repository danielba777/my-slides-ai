"use client";
import {
  Calendar,
  CalendarClock,
  FileCheck,
  Home,
  Images,
  TestTube2,
  User,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

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
  {
    title: "AI Avatars",
    url: "/dashboard/ai-avatars",
    icon: User,
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
    title: "Calendar",
    url: "/dashboard/posts/calendar",
    icon: Calendar,
  },
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
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex justify-center items-center gap-2 py-4">
          <AppLogo size={32} borderRadius={6} />
          <p className="text-lg font-bold">SlidesCockpit</p>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {startItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="font-semibold"
                    isActive={pathname === item.url}
                  >
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
                  <SidebarMenuButton
                    asChild
                    className="font-semibold"
                    isActive={pathname === item.url}
                  >
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
                  <SidebarMenuButton
                    asChild
                    className="font-semibold"
                    isActive={pathname === item.url}
                  >
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
                  <SidebarMenuButton
                    asChild
                    className="font-semibold"
                    isActive={pathname.startsWith(item.url)}
                  >
                    <a
                      href={item.url}
                      data-active={pathname.startsWith(item.url)}
                    >
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
                  <SidebarMenuButton
                    asChild
                    className="font-semibold"
                    isActive={pathname.startsWith(item.url)}
                  >
                    <a
                      href={item.url}
                      data-active={pathname.startsWith(item.url)}
                    >
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
