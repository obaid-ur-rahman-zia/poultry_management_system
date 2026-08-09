"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  User,
  Home,
  TrendingUp,
  FileText,
  ShoppingCart,
  Activity,
  DollarSign,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
// import LanguageSwitcher from "@/components/LanguageSwitcher";

import { useTheme } from "next-themes";
import Image from "next/image";
import { SITE } from "@/lib/constants";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Quick access buttons - matching the Quick Links style from quick-access page
const quickAccessLinks = [
  { href: "/", name: "Dashboard", icon: Home, color: "bg-blue-500" },
  // { href: "/account", name: "Accounts", icon: Users, color: "bg-green-500" },
  {
    href: "/sale",
    name: "Whole Sale",
    icon: ShoppingCart,
    color: "bg-purple-500",
  },
  {
    href: "/transactions",
    name: "Recovery",
    icon: Activity,
    color: "bg-teal-500",
  },
  
  {
    href: "/expense-head",
    name: "Expenses",
    icon: DollarSign,
    color: "bg-teal-500",
  },
  { href: "/local-sale", name: "Local Sale", icon: ShoppingCart, color: "bg-pink-500" },
  { href: "/reports", name: "Reports", icon: FileText, color: "bg-orange-500" },
  
];

const Header = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getThemeIcon = () => {
    if (!mounted) return <Sun className="w-5 h-5" />;
    if (theme === "light") return <Sun className="w-5 h-5" />;
    if (theme === "dark") return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 w-full bg-card border-b border-muted">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section - Quick Access Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                      <Image
                        src={SITE.LOGO}
                        alt="Logo"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                    <span className="font-bold text-base bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {SITE.COMPANY.NAME}
                    </span>
                  </div>
                </div>
              </SheetHeader>
              <SheetFooter>
                <TooltipProvider></TooltipProvider>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Quick Access Buttons - Desktop */}
          <TooltipProvider>
            <div className="hidden md:flex items-center gap-1.5">
              {quickAccessLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Tooltip key={link.href}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col items-center gap-1 h-auto py-1.5 px-2.5 hover:shadow-md transition-all hover:bg-slate-700 hover:text-white hover:border-slate-700 group",
                        )}
                        onClick={() => router.push(link.href)}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm",
                            link.color,
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] leading-tight font-medium">
                          {link.name}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{link.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        {/* Right Section - Theme Toggle & Profile */}
        <TooltipProvider>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme Toggle */}

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 gap-2 px-2 hover:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        user?.image ||
                        `https://ui-avatars.com/api/?name=${user?.name || "YOU"}`
                      }
                      alt="User"
                    />
                    <AvatarFallback>YOU</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start text-sm">
                    <span className="font-semibold leading-none">
                      {user?.name || ""}
                    </span>
                    <span className="text-xs text-muted-foreground leading-none mt-1">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">
                      {user?.name}
                      <span className="text-[8px] bg-muted p-2 py-1 ml-3 rounded-xl text-foreground font-normal">
                        {user?.role}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
};

export default Header;
