import SideBarDropdown from "@/components/auth/Dropdown";

export function SidebarAccountSection() {
  return (
    <div className="mt-auto border-t border-sidebar-border px-4 py-4">
      <SideBarDropdown shouldViewFullName align="start" />
    </div>
  );
}
