"use client";

import { SidebarAccountSection } from "@/components/app-sidebar-account";
import { SidebarUsageSummary } from "@/components/app-sidebar-usage";
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
  Download,
  EclipseIcon,
  FileText,
  Home,
  Image as ImageIcon,
  Music,
  Play,
  Users,
  type LucideIcon,
} from "lucide-react";
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
    title: "Custom Imagesets",
    url: "/admin/slideshows/custom-imagesets",
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
  {
    title: "Download",
    url: "/admin/slideshows/download",
    icon: Download,
  },
];

const avatarItems: SidebarItem[] = [
  {
    title: "Templates",
    url: "/admin/ai-avatars/templates",
    icon: ImageIcon,
  },
];

const ugcItems: SidebarItem[] = [
  {
    title: "Reaction Avatars",
    url: "/admin/ugc/reaction-avatars",
    icon: Play,
  },
  {
    title: "Sounds",
    url: "/admin/sounds",
    icon: Music,
  },
];

const landingpageItems: SidebarItem[] = [
  {
    title: "Themes",
    url: "/admin/landing-page/themes",
    icon: EclipseIcon,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex items-center justify-center gap-2 py-4">
          <AppLogo size={32} />
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

        <SidebarGroup>
          <SidebarGroupLabel>AI Avatars</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {avatarItems.map((item) => (
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
          <SidebarGroupLabel>UGC</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ugcItems.map((item) => (
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
          <SidebarGroupLabel>Landing Page</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {landingpageItems.map((item) => (
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

      <SidebarFooter className="space-y-3">
        <SidebarUsageSummary />
        <SidebarAccountSection />
      </SidebarFooter>
    </Sidebar>
  );
}
