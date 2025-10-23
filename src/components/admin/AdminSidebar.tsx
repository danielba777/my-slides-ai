"use client";

import { SidebarAccountSection } from "@/components/app-sidebar-account";
import { AppLogo } from "@/components/logo/AppLogo";
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
import {
  FileText,
  Home,
  Image as ImageIcon,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

interface SidebarItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const homeItems: SidebarItem[] = [
  {
    title: "Home",
    url: "/admin/home",
    icon: Home,
  },
];

const slideshowItems: SidebarItem[] = [
  {
    title: "Imagesets",
    url: "/admin/slideshows/imagesets",
    icon: ImageIcon,
  },
  {
    title: "TikTok Accounts",
    url: "/admin/slideshow-library/accounts",
    icon: Users,
  },
  {
    title: "Posts",
    url: "/admin/slideshow-library/posts",
    icon: FileText,
  },
];

export function AdminSidebar() {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex items-center justify-center gap-2 py-4">
          <AppLogo size={32} dark={resolvedTheme === "dark"} />
          <p className="text-lg font-bold">SlidesCockpit</p>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {homeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="font-semibold"
                    isActive={pathname === item.url}
                  >
                    <a href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-semibold">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Slideshows</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {slideshowItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="font-semibold"
                    isActive={pathname === item.url}
                  >
                    <a href={item.url}>
                      <item.icon className="h-5 w-5" />
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
