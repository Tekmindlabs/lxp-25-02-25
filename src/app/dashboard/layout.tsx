"use client";

import { DashboardNav } from "@/components/dashboard/nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "next-auth/react";
import { useState } from "react";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardContent>{children}</DashboardContent>;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const greeting = getGreeting();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto">
          <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <DashboardNav onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            <a 
            href={session?.user?.roles?.[0] 
              ? `/dashboard/${session.user.roles[0].toLowerCase()}` 
              : "/dashboard"} 
            className="font-bold text-lg hidden sm:block"
            >
            RBAC Dashboard
            </a>
          </div>
          
          {session?.user && (
            <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline-flex items-center">
              {greeting}, {session.user.name}
              {session.user.roles && session.user.roles.length > 0 && (
              <span className="ml-1 text-xs">
                ({session.user.roles[0]})
              </span>
              )}
            </span>
            <UserNav />
            </div>
          )}
          </div>
        </div>
        </header>

      <main className="flex-1">
        <div className="container mx-auto py-4">
          {children}
        </div>
      </main>
    </div>
  );
}
