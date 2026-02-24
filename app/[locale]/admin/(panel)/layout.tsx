import { Metadata } from "next";

import { AdminSidebar } from "@/components/admin-sidebar";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitch } from "@/components/theme-switch";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin - Tsuky Tales" },
  robots: { index: false, follow: false },
};

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-end gap-3 px-6 py-3 border-b border-divider bg-background/80 backdrop-blur-md shrink-0">
          <LocaleSwitcher />
          <ThemeSwitch />
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
