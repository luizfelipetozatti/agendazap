import { Button } from "@agendazap/ui";
import {
  Calendar,
  LayoutDashboard,
  Settings,
  Users,
  Briefcase,
  LogOut,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">AgendaZap</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 p-4">
            <NavLink href="/dashboard" icon={LayoutDashboard}>
              Visão Geral
            </NavLink>
            <NavLink href="/dashboard/bookings" icon={Calendar}>
              Agendamentos
            </NavLink>
            <NavLink href="/dashboard/services" icon={Briefcase}>
              Serviços
            </NavLink>
            <NavLink href="/dashboard/whatsapp" icon={MessageCircle}>
              WhatsApp
            </NavLink>
            <NavLink href="/dashboard/settings" icon={Settings}>
              Configurações
            </NavLink>
          </nav>

          {/* User */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium">
                  {user.email}
                </p>
              </div>
              <form action={signOut}>
                <Button variant="ghost" size="icon" type="submit">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
