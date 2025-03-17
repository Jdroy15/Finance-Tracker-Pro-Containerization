import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  LineChart,
} from "lucide-react";

export function NavSidebar() {
  const { logoutMutation } = useAuth();
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/add", label: "Add Expense", icon: PlusCircle },
    { href: "/analytics", label: "Analytics", icon: LineChart },
  ];

  return (
    <div className="flex flex-col h-screen border-r bg-card p-4 w-64">
      <div className="text-xl font-bold mb-8">FinTrack</div>
      <nav className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant={location === href ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
