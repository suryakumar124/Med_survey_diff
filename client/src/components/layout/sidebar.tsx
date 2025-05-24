import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/common/logo";
import {
  LayoutDashboard,
  FileText,
  Users,
  UserPlus,
  BarChart3,
  Award,
  CheckCircle,
  User,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Navigation items based on user role
  const clientNavItems = [
    { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/client/surveys", label: "Surveys", icon: FileText },
    { href: "/client/doctors", label: "Doctors", icon: Users },
    { href: "/client/representatives", label: "Representatives", icon: UserPlus },
    { href: "/client/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const repNavItems = [
    { href: "/rep/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/rep/doctors", label: "My Doctors", icon: Users },
    // { href: "/rep/onboarding", label: "Onboarding", icon: UserPlus },
  ];

  const doctorNavItems = [
    { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctor/available-surveys", label: "Available Surveys", icon: FileText },
    { href: "/doctor/completed-surveys", label: "Completed Surveys", icon: CheckCircle },
    { href: "/doctor/points", label: "My Points", icon: Award },
    { href: "/doctor/profile", label: "Profile", icon: User },
  ];

  let navItems = clientNavItems;
  if (user?.role === "rep") {
    navItems = repNavItems;
  } else if (user?.role === "doctor") {
    navItems = doctorNavItems;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center justify-center h-16 px-4 border-b border-sidebar-border bg-sidebar-background">
        <Logo className="text-sidebar-foreground" />
      </div>
      
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <div key={item.href}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      isActive 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                    )}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60")} />
                    {item.label}
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
      
      <div className="flex flex-col px-3 py-4 space-y-2 border-t border-sidebar-border">
        <div className="flex items-center p-2 space-x-3">
          <Avatar>
            <AvatarImage src={user?.profilePicture || ""} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {user?.name ? getInitials(user.name) : "??"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.role === "doctor" ? "Doctor" : user?.role === "rep" ? "Representative" : "Client"}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/10"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-3 h-5 w-5 text-sidebar-foreground/60" />
          Logout
        </Button>
      </div>
    </div>
  );

  const MobileMenuButton = () => (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-sidebar-background text-sidebar-foreground">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <MobileMenuButton />
      <aside className={cn("hidden md:flex md:flex-col w-64 bg-sidebar-background text-sidebar-foreground", className)}>
        <SidebarContent />
      </aside>
    </>
  );
}
